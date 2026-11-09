"""STT (faster-whisper) y TTS (Kokoro ONNX), ambos locales en CPU."""
from __future__ import annotations

import io
import os
import re
import threading
import wave

import numpy as np

from .config import MODELS_DIR

VOICES = {
    "em_alex": "Masculina, serena y neutra",
    "em_santa": "Masculina, grave y cálida",
    "ef_dora": "Femenina, clara y cercana",
}


class STT:
    def __init__(self) -> None:
        from faster_whisper import WhisperModel

        size = os.environ.get("ORION_WHISPER_MODEL", "base")
        self.model = WhisperModel(size, device="cpu", compute_type="int8",
                                  cpu_threads=int(os.environ.get("ORION_STT_THREADS", "8")))
        self._lock = threading.Lock()

    def transcribe(self, pcm16k: np.ndarray) -> str:
        with self._lock:
            segments, _ = self.model.transcribe(
                pcm16k, language="es", beam_size=1, vad_filter=False,
                condition_on_previous_text=False,
            )
            return " ".join(s.text.strip() for s in segments).strip()


_MD = re.compile(r"[*_#`>|~]|\[(.*?)\]\(.*?\)")


def clean_for_speech(text: str) -> str:
    text = _MD.sub(lambda m: m.group(1) or "", text)
    return re.sub(r"\s+", " ", text).strip()


class TTS:
    def __init__(self) -> None:
        from kokoro_onnx import Kokoro

        self.k = Kokoro(str(MODELS_DIR / "kokoro-v1.0.onnx"), str(MODELS_DIR / "voices-v1.0.bin"))
        self._lock = threading.Lock()

    def wav(self, text: str, voice: str, speed: float) -> bytes | None:
        text = clean_for_speech(text)
        if not re.search(r"\w", text):
            return None
        with self._lock:
            samples, sr = self.k.create(text, voice=voice if voice in VOICES else "em_alex",
                                        speed=float(speed), lang="es")
        pcm = (np.clip(samples, -1, 1) * 32767).astype("<i2").tobytes()
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sr)
            w.writeframes(pcm)
        return buf.getvalue()


class SentenceSplitter:
    """Acumula texto en streaming y devuelve frases completas para TTS."""

    _END = re.compile(r"(.+?[.!?…:;])(\s+|$)", re.S)

    def __init__(self, min_len: int = 25) -> None:
        self.buf = ""
        self.min_len = min_len
        self.emitted = False

    def feed(self, delta: str) -> list[str]:
        self.buf += delta
        out: list[str] = []
        pending = ""
        while True:
            m = self._END.match(self.buf)
            # Solo cortamos si después del signo viene espacio (frase cerrada de verdad)
            if not m or not m.group(2):
                break
            pending += m.group(1) + " "
            self.buf = self.buf[m.end():]
            if len(pending) >= self.min_len:
                out.append(pending.strip())
                pending = ""
        self.buf = pending + self.buf
        # Primer fragmento de la respuesta: cortamos en una coma para empezar a hablar antes.
        if not self.emitted and not out and len(self.buf) > 70:
            cut = self.buf.rfind(", ", 30)
            if cut > 0:
                out.append(self.buf[: cut + 1].strip())
                self.buf = self.buf[cut + 2:]
        if out:
            self.emitted = True
        return out

    def flush(self) -> list[str]:
        rest, self.buf = self.buf.strip(), ""
        return [rest] if rest else []
