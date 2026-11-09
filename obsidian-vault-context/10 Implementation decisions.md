---
tags: [prometeo, decisiones]
fecha: 2026-11-09
---
# Decisiones de implementación

Cambios respecto al plan inicial, decididos al construir y medir:

| Tema | Plan inicial | Implementado | Por qué |
|---|---|---|---|
| Modelo de Claude | Por defecto (Opus) | **Sonnet 5.5, effort `low`** (`PROMETEO_MODEL`) | Opus tardaba 4–30 s en la primera palabra; Sonnet ~1 s. En una conversación de voz es crítico |
| VAD (detección de voz) | Silero en el backend | **Silero en el navegador** (`@ricky0123/vad-web`) | Barge-in instantáneo; el backend recibe frases completas |
| TTS | Kokoro (PyTorch) | **kokoro-onnx** | Sin PyTorch, más ligero en CPU |
| STT | whisper `small` | **whisper `base`** (`PROMETEO_WHISPER_MODEL`) | Misma calidad en las pruebas: 1 s frente a 3 s |
| Título del proyecto | Herramienta de Claude | **Haiku en paralelo** | La herramienta retrasaba la primera palabra |
| Skills | `.claude/skills` con symlink | **`agent/` como plugin local** del SDK (`prometeo:crear-prompt`, …) | Respeta la estructura `agent/skills/` sin symlinks |

## Rebrand ORION → PROMETEO (2026-11-09)
| Tema | Decisión | Por qué |
|---|---|---|
| Nombre en textos hablados | «Prometeo» (no en mayúsculas) en `agent.md`, `definir-voz.md` y el saludo | Evitar que Kokoro lo deletree; en la UI el wordmark sigue en mayúsculas |
| Identificadores | Plugin y MCP `prometeo` → `prometeo:<skill>`, `mcp__prometeo__*`; paquetes `prometeo-backend` / `prometeo-frontend` | Coherencia con el nombre nuevo |
| Variables de entorno | `PROMETEO_*`, con `ORION_*` como alternativa (`config.env()`) | No romper configuraciones existentes |
| Proyectos antiguos | El parser acepta `**ORION**` y `**PROMETEO**`; no se reescriben | Las transcripciones previas siguen cargando |
| Rol del mensaje en el frontend | `'orion'` → `'agent'` | Independiente del nombre del agente |
| Carpetas | Repo (`~/Work/orion`) y vault (`~/Documentos/ORION`) sin renombrar | Se renombran a mano |
| i18n | Solo UI, sin librería; la voz sigue en español | El STT, el TTS y el agente están afinados para español |
| Cursor / botones | Canvas + CSS puros, sin librerías de animación | Ligero en la Iris Xe, que ya mueve el reactor 3D |

Commits: `836cc8d` rebrand · `aa99c18` botones, cometa e interacción · `d82dc83` switch de idioma. Prompt usado: [[11 Prompt rebrand Prometeo]].

## Detalles que mejoran la sensación de conversación
- El texto de Claude se trocea por frases y cada frase pasa a voz en cuanto está completa. La primera frase se corta en una coma para empezar antes.
- Antes de usar una herramienta se vacía la frase pendiente; si una skill arranca sin texto previo, Prometeo dice "Vale, me pongo con ello".
- Mientras Prometeo habla, el umbral del VAD sube para que no se interrumpa con su propia voz. Aun así, mejor con **auriculares**.
- Se filtran las alucinaciones típicas de whisper con ruido ("Gracias", "amara.org").
- Las escrituras de Claude están limitadas a `projects/<slug>/` mediante un hook `PreToolUse`.
- No se carga la configuración de usuario de Claude Code (`setting_sources=[]`), así que tu `~/.claude/CLAUDE.md` no afecta a Prometeo.

Relacionado: [[01 Arquitectura]] · [[07 Fases y roadmap]]
