---
tags: [prometeo, arquitectura]
---
# Arquitectura

```
Navegador (React + Three.js)            Backend local (Python FastAPI)
┌───────────────────────────┐  WS   ┌────────────────────────────────────┐
│ Mic → AudioWorklet (16kHz)│──────▶│ Silero VAD → faster-whisper (STT)  │
│ Reactor 3D (audio-reactivo)│      │            ↓ texto                 │
│ Chat / caja de texto      │◀──────│ Claude Agent SDK (suscripción)     │
│ Panel proyectos/artefactos│ texto │   system = agent.md                │
│ Reproductor audio         │◀──────│   skills = agent/skills/           │
└───────────────────────────┘ audio │   tools: Read/Write solo projects/ │
                                    │            ↓ stream de texto       │
                                    │ troceo por frases → Kokoro (TTS)   │
                                    └────────────────────────────────────┘
```

## Baja latencia
- Claude devuelve el texto **en streaming**. El backend lo corta por frases y cada frase pasa a TTS en cuanto está completa, así Prometeo empieza a hablar antes de terminar de pensar.
- **Barge-in:** si el usuario habla mientras Prometeo habla, el VAD lo detecta, el audio se corta y se cancela el turno.

> [!tip] Regla clave de diseño
> Lo que se **dice** es corto: 1–3 frases y como mucho 2 preguntas por turno.
> Lo largo (planes, prompts) se **escribe** en archivos de `projects/` y se muestra en el panel, sin leerlo en voz alta.

## Máquina de estados de la sesión
`idle → escuchando → pensando → hablando → idle`. Cada estado tiene su animación del reactor → [[06 UI Midnight Galaxy]].

Relacionado: [[02 Estructura del repo]] · [[PROMETEO]]
