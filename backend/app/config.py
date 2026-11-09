"""Rutas del repo y carga de agent.md / voice.md / modos."""
from __future__ import annotations

import os
import re
from pathlib import Path

import yaml

def env(name: str, default=None):
    """PROMETEO_<name>, con ORION_<name> como alternativa por compatibilidad."""
    return os.environ.get(f"PROMETEO_{name}", os.environ.get(f"ORION_{name}", default))


ROOT = Path(env("ROOT", Path(__file__).resolve().parents[2]))
AGENT_DIR = ROOT / "agent"
PROJECTS_DIR = ROOT / "projects"
MODELS_DIR = ROOT / "backend" / "models"
FRONTEND_DIST = ROOT / "frontend" / "dist"

_FM = re.compile(r"^---\s*\n(.*?)\n---\s*\n?", re.S)


def read_md(path: Path) -> tuple[dict, str]:
    """Devuelve (frontmatter, cuerpo) de un .md."""
    text = path.read_text(encoding="utf-8")
    m = _FM.match(text)
    if not m:
        return {}, text
    return (yaml.safe_load(m.group(1)) or {}), text[m.end():]


def write_md(path: Path, meta: dict, body: str) -> None:
    fm = yaml.safe_dump(meta, allow_unicode=True, sort_keys=False).strip()
    path.write_text(f"---\n{fm}\n---\n{body.lstrip()}", encoding="utf-8")


def agent_meta() -> dict:
    return read_md(AGENT_DIR / "agent.md")[0]


def agent_prompt() -> str:
    return read_md(AGENT_DIR / "agent.md")[1]


def mode_prompt(name: str) -> str:
    return read_md(AGENT_DIR / "modes" / f"{name}.md")[1]


def load_voice() -> dict:
    meta, _ = read_md(AGENT_DIR / "voice.md")
    return {"engine": "kokoro", "voice": "em_alex", "language": "es", "speed": 1.0, "configured": False, **meta}


def save_voice(**updates) -> dict:
    path = AGENT_DIR / "voice.md"
    meta, body = read_md(path)
    meta.update({k: v for k, v in updates.items() if v is not None})
    write_md(path, meta, body)
    return load_voice()
