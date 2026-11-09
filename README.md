# ORION

Agente de voz local para planificar proyectos. Hablas (o escribes) con ORION y te devuelve el plan, el prompt, las tareas y las notas en `.md`.

## Arrancar
```bash
claude login      # solo la primera vez: ORION usa tu suscripción de Claude
./run.sh          # backend :8765 + frontend :5173
```
Abre **http://localhost:5173**. Usa auriculares para que ORION no se escuche a sí mismo.

## Estructura
| Ruta | Qué es |
|---|---|
| `agent/agent.md` | Identidad, personalidad y método de ORION (system prompt) |
| `agent/voice.md` | Voz actual (Kokoro: `em_alex`, `em_santa`, `ef_dora`, y velocidad). Se define en la vista "Definir voz" |
| `agent/skills/*/SKILL.md` | Skills: `crear-prompt`, `documentar-plan`, `desglosar-tareas`, `resumen-notas` |
| `agent/modes/definir-voz.md` | Instrucciones de la conversación de primera configuración |
| `projects/<slug>/` | Proyectos: `meta.json`, `conversacion.md` y entregables |
| `backend/` | FastAPI + Claude Agent SDK + faster-whisper + Kokoro ONNX |
| `frontend/` | React + react-three-fiber (reactor y galaxia) + Silero VAD en el navegador |

## Variables opcionales
| Variable | Por defecto | Para qué |
|---|---|---|
| `ORION_MODEL` | `sonnet` | Modelo de Claude (`opus` planifica más profundo pero tarda más en hablar) |
| `ORION_EFFORT` | `low` | Esfuerzo de razonamiento |
| `ORION_WHISPER_MODEL` | `base` | `small` transcribe mejor pero tarda unos 3 s en CPU |

## Volver a la primera configuración
Pon `configured: false` en `agent/voice.md`.

Atajo de desarrollo: `http://localhost:5173/#view=inicio|voz|proyectos|conversacion`.
