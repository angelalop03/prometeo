"""Modelos locales vía LM Studio.

LM Studio guarda los modelos en ~/.lmstudio/models (su «downloadsFolder») y los sirve
en localhost:1234 con una API compatible con la de Anthropic, así que el mismo Claude
Agent SDK sirve para ambos: basta con cambiar ANTHROPIC_BASE_URL en el entorno del
proceso de Claude Code de cada sesión (nunca en os.environ: las sesiones que van con
Claude comparten proceso).
"""
from __future__ import annotations

import asyncio
import json
import logging
import urllib.error
import urllib.request

from .config import load_settings

log = logging.getLogger("prometeo")

PREFIX = "local:"
_load_lock = asyncio.Lock()


class LocalUnavailable(RuntimeError):
    pass


def is_local(model: str) -> bool:
    return model.startswith(PREFIX)


def model_id(model: str) -> str:
    return model[len(PREFIX):]


def backend_key(model: str) -> str:
    """Quién «posee» una sesión guardada: no se puede reanudar con otro proveedor
    (los bloques de razonamiento de un modelo local no llevan firma válida para Claude)."""
    return f"lmstudio:{load_settings()['lmstudio_url']}" if is_local(model) else "claude"


def _request(path: str, body: dict | None = None, timeout: float = 1.5) -> dict:
    url = load_settings()["lmstudio_url"].rstrip("/") + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method="POST" if body is not None else "GET",
                                 headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read() or b"{}")


def list_models() -> dict:
    """Modelos de LM Studio (sin los de embeddings). Nunca bloquea más de ~1,5 s."""
    try:
        data = _request("/api/v1/models")
    except (OSError, urllib.error.URLError, ValueError) as e:
        return {"reachable": False, "models": [], "error": str(getattr(e, "reason", e))}
    models = []
    for m in data.get("models", []):
        if m.get("type") != "llm":
            continue
        models.append({
            "id": m["key"], "name": m.get("display_name") or m["key"],
            "params": m.get("params_string"), "size": m.get("size_bytes"),
            "loaded": bool(m.get("loaded_instances")),
            "tools": bool((m.get("capabilities") or {}).get("trained_for_tool_use")),
            "max_context": m.get("max_context_length"),
        })
    return {"reachable": True, "models": models}


def _ensure_loaded_sync(mid: str, context: int) -> None:
    try:
        data = _request("/api/v1/models", timeout=3)
    except (OSError, urllib.error.URLError, ValueError) as e:
        raise LocalUnavailable(f"LM Studio no responde en {load_settings()['lmstudio_url']}. "
                               "Ábrelo y activa el servidor (lms server start).") from e
    info = next((m for m in data.get("models", []) if m.get("key") == mid), None)
    if info is None:
        raise LocalUnavailable(f"LM Studio no tiene el modelo «{mid}».")
    context = min(context, info.get("max_context_length") or context)
    instances = info.get("loaded_instances") or []
    if any((i.get("config") or {}).get("context_length", 0) >= context for i in instances):
        return
    # Cargado con poco contexto (la carga automática de LM Studio usa 8k): lo recargamos.
    for i in instances:
        _request("/api/v1/models/unload", {"instance_id": i["id"]}, timeout=30)
    log.info("Cargando %s en LM Studio con %d tokens de contexto", mid, context)
    _request("/api/v1/models/load", {"model": mid, "context_length": context}, timeout=300)


# Sin esto, Claude Code mete en cada sesión los conectores de la cuenta de claude.ai (Figma,
# OpenArt, Drive, Docs...): ~86 herramientas y sus instrucciones, unos 60k tokens por sesión
# que Prometeo no usa. Y como llegan tras la primera llamada, cambian el prompt y rompen la caché.
NO_CLAUDEAI_MCP = {"ENABLE_CLAUDEAI_MCP_SERVERS": "false"}


async def prepare(model: str) -> dict:
    """Opciones de ClaudeAgentOptions para un modelo (Claude o local). Si es local, se
    asegura de que LM Studio lo tenga cargado con el contexto configurado."""
    if not is_local(model):
        return {"model": model, "env": dict(NO_CLAUDEAI_MCP)}
    mid = model_id(model)
    st = load_settings()
    async with _load_lock:
        await asyncio.to_thread(_ensure_loaded_sync, mid, int(st["local_context"]))
    env = {
        "ANTHROPIC_BASE_URL": st["lmstudio_url"].rstrip("/"),
        "ANTHROPIC_AUTH_TOKEN": "lmstudio",
        "ANTHROPIC_API_KEY": "",
        # Claude Code hace llamadas de fondo con «haiku» (títulos, resúmenes): que vayan al mismo modelo.
        "ANTHROPIC_DEFAULT_HAIKU_MODEL": mid, "ANTHROPIC_SMALL_FAST_MODEL": mid,
        "ANTHROPIC_DEFAULT_SONNET_MODEL": mid, "ANTHROPIC_DEFAULT_OPUS_MODEL": mid,
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
        **NO_CLAUDEAI_MCP,
    }
    return {"model": mid, "env": env}
