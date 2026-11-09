"""Cerebro de PROMETEO: Claude Agent SDK usando la suscripción de Claude Code (sin API key)."""
from __future__ import annotations

import asyncio
import os
from collections.abc import AsyncIterator, Callable
from datetime import date
from pathlib import Path
from typing import Any

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    HookMatcher,
    ResultMessage,
    StreamEvent,
    ToolUseBlock,
    create_sdk_mcp_server,
    tool,
)

from . import projects
from .config import AGENT_DIR, env, agent_prompt, mode_prompt, save_voice
from .speech import VOICES

# Nunca usar una API key aunque exista en el entorno: queremos la suscripción.
os.environ.pop("ANTHROPIC_API_KEY", None)

FILE_TOOLS = ["Read", "Write", "Edit", "Glob"]
PROMETEO_SKILLS = sorted(f"prometeo:{d.name}" for d in (AGENT_DIR / "skills").iterdir() if (d / "SKILL.md").exists())


def _path_guard(root: Path):
    root = root.resolve()

    async def guard(input_data: dict, tool_use_id: str | None, context: Any) -> dict:
        ti = input_data.get("tool_input", {}) or {}
        raw = ti.get("file_path") or ti.get("path")
        if not raw:
            return {}
        p = Path(raw)
        p = (p if p.is_absolute() else root / p).resolve()
        if p == root or p.is_relative_to(root):
            return {}
        return {"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": f"Solo puedes acceder a la carpeta del proyecto ({root}).",
        }}

    return guard


class Brain:
    """Una conversación con Claude. mode = 'plan' (proyecto) | 'voz' (definir voz)."""

    def __init__(self, mode: str, slug: str | None = None,
                 on_event: Callable[[dict], Any] | None = None) -> None:
        self.mode = mode
        self.slug = slug
        self.on_event = on_event or (lambda e: None)
        self.client: ClaudeSDKClient | None = None
        self._dirty = False

    def _options(self) -> ClaudeAgentOptions:
        # Sonnet + effort bajo: ~1 s hasta la primera palabra (Opus tarda 4-30 s, demasiado para voz).
        common = dict(setting_sources=[], include_partial_messages=True,
                      model=env("MODEL", "sonnet"),
                      effort=env("EFFORT", "low"))

        if self.mode == "voz":
            @tool("set_voice", "Cambia la voz de PROMETEO en vivo. voice: em_alex | em_santa | ef_dora. speed: 0.8-1.3",
                  {"voice": str, "speed": float})
            async def set_voice(args: dict) -> dict:
                v = args.get("voice") if args.get("voice") in VOICES else None
                s = min(1.3, max(0.8, float(args.get("speed") or 1.0)))
                cfg = save_voice(voice=v, speed=round(s, 2))
                await self.on_event({"type": "voice", "voice": cfg})
                return {"content": [{"type": "text", "text": f"Voz actual: {cfg['voice']} a velocidad {cfg['speed']}"}]}

            @tool("finish_voice_setup", "Guarda la voz elegida y termina la configuración inicial.", {})
            async def finish(args: dict) -> dict:
                cfg = save_voice(configured=True)
                await self.on_event({"type": "voice_setup_done", "voice": cfg})
                return {"content": [{"type": "text", "text": "Configuración de voz guardada."}]}

            server = create_sdk_mcp_server("prometeo", tools=[set_voice, finish])
            return ClaudeAgentOptions(
                system_prompt=agent_prompt() + "\n\n" + mode_prompt("definir-voz"),
                mcp_servers={"prometeo": server}, tools=[],
                allowed_tools=["mcp__prometeo__set_voice", "mcp__prometeo__finish_voice_setup"],
                cwd=str(AGENT_DIR), max_turns=6, **common,
            )

        # --- modo plan ---
        pdir = projects.project_dir(self.slug)
        meta = projects.get_meta(self.slug)

        guard = _path_guard(pdir)
        ctx = (f"\n\n# Contexto de la sesión\n- Fecha: {date.today():%d/%m/%Y}\n"
               f"- Proyecto: «{meta['title']}». Carpeta de trabajo: {pdir}\n"
               f"- Solo puedes leer y escribir archivos dentro de esa carpeta.")
        return ClaudeAgentOptions(
            system_prompt=agent_prompt() + ctx,
            tools=FILE_TOOLS + ["Skill"], allowed_tools=FILE_TOOLS,
            plugins=[{"type": "local", "path": str(AGENT_DIR)}], skills=PROMETEO_SKILLS,
            permission_mode="acceptEdits", cwd=str(pdir), resume=meta.get("session_id"),
            hooks={"PreToolUse": [HookMatcher(matcher="Read|Write|Edit|Glob", hooks=[guard])]},
            max_turns=20, **common,
        )

    async def start(self) -> None:
        self.client = ClaudeSDKClient(options=self._options())
        await self.client.connect()

    async def ask(self, text: str) -> AsyncIterator[dict]:
        """Envía un mensaje y produce eventos: delta, tool, done."""
        assert self.client
        if self._dirty:
            # Tras una interrupción quedan mensajes del turno cancelado: los descartamos.
            try:
                async with asyncio.timeout(15):
                    async for _ in self.client.receive_response():
                        pass
            except TimeoutError:
                pass
            self._dirty = False
        await self.client.query(text)
        said_any = False
        async for msg in self.client.receive_response():
            if isinstance(msg, StreamEvent):
                ev = msg.event
                if ev.get("type") == "content_block_start" and ev.get("content_block", {}).get("type") == "text" and said_any:
                    yield {"type": "delta", "text": " "}
                elif ev.get("type") == "content_block_delta" and ev["delta"].get("type") == "text_delta":
                    said_any = True
                    yield {"type": "delta", "text": ev["delta"]["text"]}
            elif isinstance(msg, AssistantMessage):
                for b in msg.content:
                    if isinstance(b, ToolUseBlock):
                        yield {"type": "tool", "name": b.name,
                               "file": Path(b.input.get("file_path", "")).name or None,
                               "skill": b.input.get("skill") or b.input.get("command")}
            elif isinstance(msg, ResultMessage):
                if self.mode == "plan" and msg.session_id:
                    projects.update_meta(self.slug, session_id=msg.session_id)
                yield {"type": "done", "error": msg.is_error, "session_id": msg.session_id}

    async def interrupt(self) -> None:
        if self.client:
            self._dirty = True
            try:
                await self.client.interrupt()
            except Exception:
                pass

    async def close(self) -> None:
        if self.client:
            try:
                await self.client.disconnect()
            except Exception:
                pass
            self.client = None


async def suggest_title(text: str) -> str | None:
    """Título corto para un proyecto, con Haiku y en paralelo (no bloquea la voz)."""
    opts = ClaudeAgentOptions(
        system_prompt="Devuelves solo un título de 2 a 6 palabras en español, sin comillas ni punto final.",
        setting_sources=[], tools=[], max_turns=1, model="haiku",
    )
    out = ""
    try:
        async with ClaudeSDKClient(options=opts) as c:
            await c.query(f"Título para este proyecto: {text[:600]}")
            async for m in c.receive_response():
                if isinstance(m, AssistantMessage):
                    out += "".join(getattr(b, "text", "") for b in m.content)
    except Exception:
        return None
    title = out.strip().strip('"«»').rstrip(".").strip()
    return title[:80] or None
