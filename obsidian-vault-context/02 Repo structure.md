---
tags: [prometeo, repo]
updated: 2026-11-09
---
# Repository structure

Path: `~/Work/prometeo`

```
prometeo/
├── agent/                      # local Agent SDK plugin, named "prometeo"
│   ├── .claude-plugin/plugin.json
│   ├── agent.md                # INTERVIEWER: name, role, personality, method, questions, MCP, handoff
│   ├── arquitecto.md           # ARCHITECT: analyses what was gathered and writes the deliverables (Opus)
│   ├── mcp-catalog.md          # MCP servers the interviewer may recommend
│   ├── voice.md                # DEFAULT voice (engine, voice, speed, language); configured: false
│   ├── modes/definir-voz.md    # first-time voice setup conversation
│   └── skills/                 # each skill = folder with SKILL.md → prometeo:<skill>
│       ├── crear-prompt/ · documentar-plan/ · desglosar-tareas/ · resumen-notas/
├── projects/
│   └── <date-slug>/
│       ├── meta.json           # title, dates, session_id/architect_session_id + session_backend/architect_backend
│       ├── brief.md            # latest brief from interviewer to Architect (hidden in the panel)
│       ├── conversacion.md     # «**Tú** (hh:mm): …» / «**PROMETEO** (hh:mm): …»
│       └── plan.md · prompt.md · notas.md · tareas.md
├── backend/                    # Python 3.12, uv, FastAPI — package prometeo-backend
│   ├── models/                 # kokoro-v1.0.onnx + voices-v1.0.bin (not versioned)
│   └── app/
│       ├── main.py             # REST (/api/state, /api/settings, /api/voice, /api/voices/{id}/sample, DELETE /api/projects/{slug}) + WebSocket /ws; model reloading
│       ├── brain.py            # Claude Agent SDK: Brain (interviewer: streaming, resume, cancellation, MCP "prometeo" with encargar_entregables) + run_architect
│       ├── speech.py           # faster-whisper (STT) + kokoro-onnx (TTS) on CPU/GPU, VOICES catalog, SAMPLE_TEXT
│       ├── config.py           # paths, env() with PROMETEO_* (fallback ORION_*), agent.md / arquitecto.md / mcp-catalog.md / voice.md, settings.local.json
│       ├── local.py            # LM Studio: list models, load with context, per-session env for local models
│       └── projects.py         # CRUD for projects/ (including delete)
├── frontend/                   # Vite + React + TypeScript — package prometeo-frontend
│   └── src/
│       ├── App.tsx             # #/… routes, Nav and views: Comenzar · DefinirVoz · Inicio · Proyectos · Voces · Ajustes · Conversación
│       ├── api.ts              # typed REST calls + playSample/stopSample (voice samples)
│       ├── session.ts          # WebSocket, messages, reactor energy, microphone
│       ├── i18n.ts             # ES/EN interface strings
│       ├── index.css           # tokens and styles (cosmic buttons, cursor, navigation, pages, voices, settings)
│       ├── scene/Scene.tsx     # reactor + galaxy (react-three-fiber)
│       ├── audio/              # mic (VAD) · player · levels
│       └── ui/
│           ├── CosmicButton.tsx  # main cosmic button
│           ├── CometCursor.tsx   # comet cursor (canvas)
│           └── cosmic.ts         # cursor ↔ buttons interaction + cursorBus
├── settings.local.json         # this machine's settings (not versioned)
├── run.sh                      # backend :8765 + frontend :5173 (Vite accepts PROMETEO_BACKEND to point at another backend)
└── README.md
```

Related: [[03 Agent (agent.md)]] · [[04 Voice (voice.md)]] · [[05 Skills]] · [[06 UI Midnight Galaxy]]
