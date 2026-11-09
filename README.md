# PROMETEO

Agente de voz local para planificar proyectos. Hablas (o escribes) con PROMETEO y te devuelve el plan, el prompt, las tareas y las notas en `.md`.

## Arrancar
```bash
claude login      # solo la primera vez: PROMETEO usa tu suscripción de Claude
./run.sh          # backend :8765 + frontend :5173
```
Abre **http://localhost:5173**. Usa auriculares para que PROMETEO no se escuche a sí mismo.

## Estructura
| Ruta | Qué es |
|---|---|
| `agent/agent.md` | **Entrevistador**: identidad, método y preguntas de PROMETEO (rápido, habla contigo) |
| `agent/arquitecto.md` | **Arquitecto**: modelo profundo que analiza lo recabado y escribe los entregables en segundo plano |
| `agent/mcp-catalog.md` | Servidores MCP que el entrevistador puede recomendar según el proyecto |
| `agent/voice.md` | Voz **por defecto** (Kokoro). La elegida en cada ordenador va a `settings.local.json` |
| `settings.local.json` | Ajustes de esta máquina (voz, CPU/GPU, modelo de Whisper, de Claude o local). No se versiona |
| `agent/skills/*/SKILL.md` | Skills: `crear-prompt`, `documentar-plan`, `desglosar-tareas`, `resumen-notas` |
| `agent/modes/definir-voz.md` | Instrucciones de la conversación de primera configuración |
| `projects/<slug>/` | Proyectos: `meta.json`, `conversacion.md` y entregables |
| `backend/` | FastAPI + Claude Agent SDK (Claude o LM Studio) + faster-whisper + Kokoro ONNX |
| `frontend/` | React + react-three-fiber (reactor y galaxia) + Silero VAD en el navegador |

## Ajustes
Todo se cambia desde la vista **Ajustes** (voz, velocidad, CPU/GPU, modelo de Whisper, modelo y esfuerzo de Claude, idioma) y la vista **Voces** (escuchar cada voz y elegirla).

**GPU (NVIDIA):** Whisper puede ir en GPU instalando las librerías CUDA en el backend:
```bash
cd backend && uv pip install nvidia-cublas-cu12 "nvidia-cudnn-cu12>=9,<10"
```
Para Kokoro en GPU, instala además `onnxruntime-gpu` (misma versión que `onnxruntime`) con sus librerías CUDA 13:
```bash
cd backend && uv pip install "onnxruntime-gpu[cuda,cudnn]==1.31.1"
```
Se instala encima de `onnxruntime` (que `kokoro-onnx` exige y `uv run` repondría si se quitase), así que no desinstales ninguno de los dos. Si `onnxruntime` se reinstala o actualiza, vuelve a ejecutar el comando. Necesita un driver con CUDA 13. Si la GPU falla, PROMETEO vuelve a CPU y lo indica en Ajustes.

## Modelos locales (LM Studio)
El entrevistador, el Arquitecto y el título pueden usar un modelo local en vez de Claude: en **Ajustes → Cerebro**, botón **LOCAL** y eliges el modelo.

- Los modelos los gestiona LM Studio y los guarda en `~/.lmstudio/models` (su `downloadsFolder`, en `~/.lmstudio/settings.json`). Para añadir uno, descárgalo desde LM Studio: aparece solo en PROMETEO.
- El servidor de LM Studio tiene que estar en marcha: `lms server start` (por defecto en `http://localhost:1234`, configurable en Ajustes).
- PROMETEO usa la API compatible con Anthropic de LM Studio, así que todo sigue pasando por el mismo Claude Agent SDK.
- Carga el modelo con el contexto elegido en Ajustes (32K por defecto; la carga automática de LM Studio solo da 8K).
- Cada modelo distinto ocupa su propia memoria de vídeo: con 8 GB usa el mismo para todo.
- Si cambias de proveedor en un proyecto empezado, la sesión no se reanuda (los historiales no son compatibles): el modelo nuevo relee `conversacion.md`.

## Variables opcionales
Valores por defecto; lo que guardes en Ajustes tiene prioridad.

Las antiguas `ORION_*` siguen funcionando como alternativa.

| Variable | Por defecto | Para qué |
|---|---|---|
| `PROMETEO_MODEL` | `sonnet` | Modelo del entrevistador (el que habla; mejor rápido) |
| `PROMETEO_EFFORT` | `low` | Esfuerzo del entrevistador |
| `PROMETEO_ARCHITECT_MODEL` | `opus` | Modelo del Arquitecto (escribe los entregables) |
| `PROMETEO_ARCHITECT_EFFORT` | `high` | Esfuerzo del Arquitecto (`medium`…`max`) |
| `PROMETEO_TITLE_MODEL` | `haiku` | Modelo del título automático (`haiku`, `sonnet` o `local:<id>`) |
| `PROMETEO_LMSTUDIO_URL` | `http://localhost:1234` | Servidor de LM Studio |
| `PROMETEO_LOCAL_CONTEXT` | `32768` | Contexto con el que se cargan los modelos locales |
| `PROMETEO_WHISPER_MODEL` | `base` | `small` transcribe mejor pero tarda unos 3 s en CPU |

## Volver a la primera configuración
Ajustes → «Repetir primera configuración» (o borra `settings.local.json`).

Rutas: `http://localhost:5173/#/inicio|proyectos|voces|ajustes|voz|comenzar|conversacion[/slug]`. Atrás/adelante del navegador funcionan.
