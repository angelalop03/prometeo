---
tags: [prometeo, repo]
actualizado: 2026-11-09
---
# Estructura del repositorio

Ruta: `/home/manuel/Work/prometeo`


```
prometeo/
├── agent/                      # plugin local del Agent SDK, nombre "prometeo"
│   ├── .claude-plugin/plugin.json
│   ├── agent.md                # nombre, rol, finalidad, personalidad, trato, método
│   ├── voice.md                # motor TTS, voz, velocidad, idioma (frontmatter YAML)
│   ├── modes/definir-voz.md    # conversación de primera configuración
│   └── skills/                 # cada skill = carpeta con SKILL.md → prometeo:<skill>
│       ├── crear-prompt/ · documentar-plan/ · desglosar-tareas/ · resumen-notas/
├── projects/
│   └── <fecha-slug>/
│       ├── meta.json           # título, fechas, session_id de Claude
│       ├── conversacion.md     # «**Tú** (hh:mm): …» / «**PROMETEO** (hh:mm): …»
│       └── plan.md · prompt.md · notas.md · tareas.md
├── backend/                    # Python 3.12, uv, FastAPI — paquete prometeo-backend
│   ├── models/                 # kokoro-v1.0.onnx + voices-v1.0.bin (no versionados)
│   └── app/
│       ├── main.py             # REST + WebSocket /ws
│       ├── brain.py            # Claude Agent SDK: streaming, resume, cancelación, MCP "prometeo"
│       ├── speech.py           # faster-whisper (STT) + kokoro-onnx (TTS)
│       ├── config.py           # rutas, env() con PROMETEO_* (fallback ORION_*), agent.md / voice.md
│       └── projects.py         # CRUD de projects/
├── frontend/                   # Vite + React + TypeScript — paquete prometeo-frontend
│   └── src/
│       ├── App.tsx             # vistas: Comenzar · DefinirVoz · Inicio · Proyectos · Conversación
│       ├── session.ts          # WebSocket, mensajes, energía del reactor, micrófono
│       ├── i18n.ts             # textos ES/EN de la interfaz
│       ├── index.css           # tokens y estilos (botones cósmicos, cursor, switch)
│       ├── scene/Scene.tsx     # reactor + galaxia (react-three-fiber)
│       ├── audio/              # mic (VAD) · player · levels
│       └── ui/
│           ├── CosmicButton.tsx  # botón principal cósmico
│           ├── CometCursor.tsx   # cursor cometa (canvas)
│           └── cosmic.ts         # interacción cursor ↔ botones + cursorBus
├── run.sh                      # backend :8765 + frontend :5173
└── README.md
```

Relacionado: [[03 Agente (agent.md)]] · [[04 Voz (voice.md)]] · [[05 Skills]] · [[06 UI Midnight Galaxy]]
