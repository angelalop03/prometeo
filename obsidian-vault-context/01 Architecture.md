---
tags: [prometeo, architecture]
updated: 2026-11-09
---
# Architecture

```
Browser (React + Three.js)              Local backend (Python FastAPI)
┌───────────────────────────┐  WS   ┌────────────────────────────────────┐
│ Mic → AudioWorklet (16kHz)│──────▶│ Silero VAD → faster-whisper (STT)  │
│ 3D reactor (audio-reactive)│      │            ↓ text                  │
│ Chat / text box           │◀──────│ Interviewer (Sonnet, streaming)    │
│ Projects/artifacts panel  │ text  │   system = agent.md + mcp-catalog  │
│ Audio player              │◀──────│   tools: Read/Glob + handoff ───┐  │
└───────────────────────────┘ audio │            ↓ text stream        │  │
                                    │ split into sentences → Kokoro   │  │
                                    │                                 ▼  │
                                    │ Architect (Opus, background)       │
                                    │   system = arquitecto.md           │
                                    │   skills = agent/skills/           │
                                    │   tools: Read/Write in projects/   │
                                    └────────────────────────────────────┘
```

## Two agents
- The **interviewer** answers fast (~1–2 s to the first word) because it doesn't draft documents.
- The **Architect** is an `asyncio` task owned by the session, not the turn: barge-in (`cancel_current`) doesn't stop it, and it keeps running even if the tab is closed (`_jobs` in `main.py`). Details → [[03 Agent (agent.md)]].

## Low latency
- Claude returns text **streamed**. The backend splits it into sentences and each sentence goes to TTS as soon as it's complete, so Prometeo starts speaking before it finishes thinking.
- **Barge-in:** if the user speaks while Prometeo is speaking, the VAD detects it, audio is cut and the turn is cancelled.

> [!tip] Key design rule
> What is **said** is short: 1–3 sentences and at most 2 questions per turn.
> Long content (plans, prompts) is **written** to files in `projects/` and shown in the panel, never read aloud.

## Session state machine
`idle → listening → thinking → speaking → idle`. Each state has its own reactor animation → [[06 UI Midnight Galaxy]].

Related: [[02 Repo structure]] · [[PROMETEO]]
