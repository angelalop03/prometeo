"""Servidor ORION: REST + WebSocket de sesión (voz/texto)."""
from __future__ import annotations

import asyncio
import json
import contextlib
import logging

import numpy as np
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles

from . import projects
from .brain import Brain, suggest_title
from .config import FRONTEND_DIST, PROJECTS_DIR, agent_meta, load_voice
from .speech import STT, TTS, VOICES, SentenceSplitter

log = logging.getLogger("orion")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

app = FastAPI(title="ORION")
PROJECTS_DIR.mkdir(exist_ok=True)

_stt: STT | None = None
_tts: TTS | None = None


def stt() -> STT:
    global _stt
    if _stt is None:
        _stt = STT()
    return _stt


def tts() -> TTS:
    global _tts
    if _tts is None:
        _tts = TTS()
    return _tts


@app.on_event("startup")
async def warmup() -> None:
    # Carga los modelos en segundo plano para que la primera frase no tarde.
    async def _load():
        await asyncio.to_thread(tts)
        await asyncio.to_thread(tts().wav, "Hola.", load_voice()["voice"], 1.0)
        await asyncio.to_thread(stt)
        log.info("Modelos de voz listos")
    asyncio.create_task(_load())


# ---------------- REST ----------------
@app.get("/api/state")
def state():
    return {"agent": agent_meta(), "voice": load_voice(), "voices": VOICES,
            "models_ready": _stt is not None and _tts is not None}


@app.get("/api/projects")
def list_projects():
    return projects.list_all()


@app.get("/api/projects/{slug}")
def get_project(slug: str):
    try:
        return {"meta": projects.get_meta(slug), "artifacts": projects.artifacts(slug),
                "conversation": projects.conversation(slug)}
    except (FileNotFoundError, ValueError):
        raise HTTPException(404, "Proyecto no encontrado")


# ---------------- Sesión WebSocket ----------------
GREETINGS = {
    "voz": "Hola, soy ORION. Antes de empezar, elijamos cómo quieres que suene mi voz. ¿La prefieres grave y serena, o más enérgica?",
    "nuevo": "Aquí estoy. ¿Qué quieres planificar hoy?",
    "reanudar": "Retomamos «{title}». ¿Por dónde seguimos?",
}


# Alucinaciones típicas de whisper con ruido o silencio
_NOISE = {"", "gracias", "gracias.", "subtítulos realizados por la comunidad de amara.org", "¡gracias!", "...", "música"}


def _meaningful(text: str) -> bool:
    t = text.strip().lower()
    return len(t) > 1 and t not in _NOISE and "amara.org" not in t


class Session:
    """Protocolo:
    cliente → {"type":"text","text"} | {"type":"interrupt"} | binario Float32 PCM 16 kHz (una frase)
    servidor → ready, state, transcript, delta, tool, project, artifacts, voice, voice_setup_done, turn_end, error
               + binario WAV (una frase de voz) precedido de {"type":"audio","turn":n}
    """

    def __init__(self, ws: WebSocket, mode: str, slug: str | None) -> None:
        self.ws, self.mode, self.slug = ws, mode, slug
        self.brain = Brain("voz" if mode == "voz" else "plan", slug, on_event=self.send)
        self.turn = 0
        self.task: asyncio.Task | None = None
        self.send_lock = asyncio.Lock()
        # Proyectos nuevos reciben título automático tras el primer mensaje
        self.titled = not slug or projects.get_meta(slug)["title"] != "Proyecto sin título"

    async def send(self, msg: dict) -> None:
        with contextlib.suppress(Exception):
            async with self.send_lock:
                await self.ws.send_json(msg)

    async def send_audio(self, turn: int, wav: bytes) -> None:
        with contextlib.suppress(Exception):
            async with self.send_lock:
                await self.ws.send_json({"type": "audio", "turn": turn})
                await self.ws.send_bytes(wav)

    async def speak(self, turn: int, sentences: asyncio.Queue) -> None:
        """Consume frases y las convierte en audio mientras Claude sigue escribiendo."""
        first = True
        while (s := await sentences.get()) is not None:
            if turn != self.turn:
                continue
            v = load_voice()
            wav = await asyncio.to_thread(tts().wav, s, v["voice"], v["speed"])
            if wav and turn == self.turn:
                if first:
                    await self.send({"type": "state", "state": "speaking"})
                    first = False
                await self.send_audio(turn, wav)

    async def say(self, text: str) -> None:
        """Frase fija (saludo) sin pasar por Claude."""
        self.turn += 1
        await self.send({"type": "turn_start", "turn": self.turn})
        await self.send({"type": "delta", "text": text})
        if self.slug:
            projects.append_turn(self.slug, "assistant", text)
        q: asyncio.Queue = asyncio.Queue()
        splitter = SentenceSplitter(min_len=15)
        for part in splitter.feed(text + " ") + splitter.flush():
            await q.put(part)
        await q.put(None)
        await self.speak(self.turn, q)
        await self.send({"type": "turn_end", "turn": self.turn})

    async def run_turn(self, user_text: str) -> None:
        self.turn += 1
        turn = self.turn
        await self.send({"type": "turn_start", "turn": turn})
        await self.send({"type": "state", "state": "thinking"})
        if self.slug:
            projects.append_turn(self.slug, "user", user_text)
        sentences: asyncio.Queue = asyncio.Queue()
        speaker = asyncio.create_task(self.speak(turn, sentences))
        if self.slug and not self.titled:
            self.titled = True
            asyncio.create_task(self.auto_title(user_text))
        splitter, full, wrote = SentenceSplitter(), "", False
        try:
            async for ev in self.brain.ask(user_text):
                if ev["type"] == "delta":
                    full += ev["text"]
                    await self.send(ev)
                    for s in splitter.feed(ev["text"]):
                        await sentences.put(s)
                elif ev["type"] == "tool":
                    # El texto anterior a una herramienta ya está completo: que suene ya.
                    for s in splitter.flush():
                        await sentences.put(s)
                    if ev["name"] == "Skill" and not full.strip():
                        # Que no haya silencio mientras se escribe el entregable
                        ack = "Vale, me pongo con ello."
                        full += ack + " "
                        await self.send({"type": "delta", "text": ack + " "})
                        await sentences.put(ack)
                    await self.send(ev)
                    wrote |= ev["name"] in ("Write", "Edit")
                elif ev["type"] == "done" and ev["error"]:
                    await self.send({"type": "error", "message": "Claude devolvió un error en este turno."})
            for s in splitter.flush():
                await sentences.put(s)
        except asyncio.CancelledError:
            await self.brain.interrupt()
            raise
        finally:
            await sentences.put(None)
            if self.slug and full.strip():
                projects.append_turn(self.slug, "assistant", full + (" [interrumpido]" if turn != self.turn else ""))
            if self.slug and wrote:
                await self.send({"type": "artifacts", "artifacts": projects.artifacts(self.slug)})
        await speaker
        await self.send({"type": "turn_end", "turn": turn})

    async def auto_title(self, text: str) -> None:
        title = await suggest_title(text)
        if title and self.slug:
            await self.send({"type": "project", "project": projects.update_meta(self.slug, title=title)})

    async def cancel_current(self) -> None:
        if self.task and not self.task.done():
            self.turn += 1  # invalida el audio pendiente del turno anterior
            self.task.cancel()
            with contextlib.suppress(BaseException):
                await self.task

    async def handle_input(self, text: str) -> None:
        await self.cancel_current()
        if text.strip():
            self.task = asyncio.create_task(self.run_turn(text))

    async def transcribe(self, data: bytes) -> None:
        pcm = np.frombuffer(data, dtype="<f4")
        if len(pcm) < 16000 * 0.3:
            return
        busy = self.task is not None and not self.task.done()
        if not busy:
            await self.send({"type": "state", "state": "thinking"})
        text = await asyncio.to_thread(stt().transcribe, pcm)
        if not _meaningful(text):
            if not busy:
                await self.send({"type": "state", "state": "idle"})
            return
        await self.send({"type": "transcript", "text": text})
        await self.handle_input(text)


@app.websocket("/ws")
async def ws_session(ws: WebSocket, mode: str = "plan", project: str | None = None):
    await ws.accept()
    greeting = "voz"
    if mode != "voz":
        if project:
            meta = projects.get_meta(project)
            greeting = "reanudar"
        else:
            meta = projects.create()
            greeting = "nuevo"
        project = meta["slug"]
    s = Session(ws, mode, project)
    try:
        await s.brain.start()
        await s.send({"type": "ready", "mode": mode,
                      "project": projects.get_meta(project) if project else None,
                      "voice": load_voice()})
        title = projects.get_meta(project)["title"] if project else ""
        s.task = asyncio.create_task(s.say(GREETINGS[greeting].format(title=title)))
        while True:
            msg = await ws.receive()
            if msg["type"] == "websocket.disconnect":
                break
            if msg.get("bytes"):
                # Solo se cancela el turno en curso si la transcripción trae texto (ver handle_input)
                asyncio.create_task(s.transcribe(msg["bytes"]))
            elif msg.get("text"):
                data = json.loads(msg["text"])
                if data["type"] == "text":
                    await s.handle_input(data["text"])
                elif data["type"] == "interrupt":
                    await s.cancel_current()
                    await s.send({"type": "state", "state": "listening"})
    except WebSocketDisconnect:
        pass
    except Exception as e:  # noqa: BLE001
        log.exception("Error de sesión")
        await s.send({"type": "error", "message": str(e)})
    finally:
        await s.cancel_current()
        await s.brain.close()
        if project and greeting == "nuevo":
            with contextlib.suppress(Exception):
                projects.delete_if_empty(project)


if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
