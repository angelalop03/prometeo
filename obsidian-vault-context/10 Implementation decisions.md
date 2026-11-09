---
tags: [prometeo, decisions]
date: 2026-11-09
updated: 2026-11-09
---
# Implementation decisions

Changes from the initial plan, decided while building and measuring:

| Topic | Initial plan | Implemented | Why |
|---|---|---|---|
| Claude model | Default (Opus) | **Sonnet 5.5, effort `low`** (`PROMETEO_MODEL`) | Opus took 4–30 s to the first word; Sonnet ~1 s. Critical in a voice conversation |
| VAD (voice detection) | Silero in the backend | **Silero in the browser** (`@ricky0123/vad-web`) | Instant barge-in; the backend receives complete utterances |
| TTS | Kokoro (PyTorch) | **kokoro-onnx** | No PyTorch, lighter on CPU |
| STT | whisper `small` | **whisper `base`** (`PROMETEO_WHISPER_MODEL`) | Same quality in tests: 1 s vs 3 s |
| Project title | Claude tool | **Haiku in parallel** | The tool delayed the first word |
| Skills | `.claude/skills` with a symlink | **`agent/` as a local SDK plugin** (`prometeo:crear-prompt`, …) | Keeps the `agent/skills/` layout without symlinks |

## Rebrand ORION → PROMETEO (2026-11-09)
| Topic | Decision | Why |
|---|---|---|
| Name in spoken text | «Prometeo» (not upper case) in `agent.md`, `definir-voz.md` and the greeting | Stops Kokoro spelling it out; the UI wordmark stays upper case |
| Identifiers | Plugin and MCP `prometeo` → `prometeo:<skill>`, `mcp__prometeo__*`; packages `prometeo-backend` / `prometeo-frontend` | Consistency with the new name |
| Environment variables | `PROMETEO_*`, with `ORION_*` as fallback (`config.env()`) | Don't break existing setups |
| Old projects | The parser accepts `**ORION**` and `**PROMETEO**`; they aren't rewritten | Previous transcripts still load |
| Message role in the frontend | `'orion'` → `'agent'` | Independent of the agent's name |
| Folders | Repo (`~/Work/orion`) and vault (`~/Documentos/ORION`) not renamed by code | Renamed by hand |
| i18n | UI only, no library; voice stays Spanish | STT, TTS and agent are tuned for Spanish |
| Cursor / buttons | Plain canvas + CSS, no animation libraries | Light on the Iris Xe, which already drives the 3D reactor |

Commits: `836cc8d` rebrand · `aa99c18` buttons, comet and interaction · `d82dc83` language switch. Prompt used: [[11 Prometeo rebrand prompt]].

## Local settings, voice catalog and GPU (2026-11-09)
Reason: on the first run on another computer **the voice setup didn't appear**. Cause: `agent/voice.md` was committed with `configured: true`.

| Topic | Before | Now | Why |
|---|---|---|---|
| Where the chosen voice lives | `agent/voice.md` (versioned) | `settings.local.json` at the root, in `.gitignore`. `voice.md` stays as the default with `configured: false` | Each machine does its own first-time setup and personal preferences aren't pushed |
| Model settings | Only `PROMETEO_MODEL`, `PROMETEO_EFFORT`, `PROMETEO_WHISPER_MODEL` env vars | **Ajustes** view + `PUT /api/settings`. Env vars remain the defaults | Change them without restarting or editing files |
| CPU / GPU | Everything on CPU | `tts_device` and `stt_device` (`cpu` · `cuda`) separately | The new machine has an RTX 4060 |
| Switching device | — | The model reloads in the background; the old one keeps serving until the new one is ready | No interruptions mid-conversation |
| If the GPU fails | — | Falls back to CPU and stores the reason (`runtime.*.error`), shown in Settings | Missing CUDA libraries must not break the voice |
| CUDA libraries | — | pip packages `nvidia-cublas-cu12` + `nvidia-cudnn-cu12` in the venv, loaded via `ctypes` (`_preload_cuda_libs`) | No system-wide CUDA install, no `LD_LIBRARY_PATH` tweaks |
| Kokoro on GPU | — | Own ONNX session (`Kokoro.from_session`) with `CUDAExecutionProvider` when available; `onnxruntime-gpu[cuda,cudnn]==1.31.1` installed **on top of** `onnxruntime` (same version), ONNX log level 3 to hide harmless Memcpy warnings | `kokoro-onnx` requires `onnxruntime` and `uv run` would reinstall it if removed, so both stay; re-run the install if `onnxruntime` is upgraded. Needs a CUDA 13 driver |
| Voices | 3 native | 3 native + 6 accented (it, pt, fr) | More timbres; labelled as accented |
| Navigation | Only wordmark → Inicio and the `#view=` shortcut | **Inicio · Proyectos · Voces · Ajustes** bar and `#/view[/slug]` routes with `pushState` | Browser back/forward buttons work |
| ES/EN switch | Next to the wordmark | In **Ajustes → Interfaz** | Its header slot went to navigation |
| Deleting projects | Didn't exist | Trash button on each card, in-card confirmation and `DELETE /api/projects/{slug}` | No browser `confirm()`; `project_dir()` prevents escaping `projects/` |
| Model locks | — | One lock for STT, one for TTS | Loading Whisper doesn't block the voice |

Measured on the RTX 4060: Whisper `base`, 4 s of audio: **~0.03 s on GPU** vs **~0.34 s on CPU**. Kokoro, one ~12-word sentence: **~0.14 s on GPU** vs **~0.84 s on CPU**.

## Two agents: interviewer + Architect (2026-11-09)
Reason: with a single agent you had to choose between **speaking fast** (Sonnet) and **plan depth** (Opus).

| Topic | Before | Now | Why |
|---|---|---|---|
| Agents | One: Sonnet converses and writes deliverables | **Interviewer** (Sonnet `low`) converses; **Architect** (Opus `high`) writes deliverables | Fast voice and deeply thought-out deliverables |
| How work is handed off | The agent invoked the skill inside its turn | MCP tool `encargar_entregables` returns immediately; the backend launches `run_architect` as a separate task | An SDK subagent (`agents=`) would block the voice turn for 1–2 min and barge-in would cancel it |
| Architect context | — | `brief.md` (interviewer's summary) + full `conversacion.md`, which wins on conflicts | The brief is quick to read; the transcript keeps details from getting lost |
| Sessions | `session_id` | `session_id` + `architect_session_id` in `meta.json` | `resume` doesn't mix the two histories |
| "Done" notice | — | `architect` + `artifacts` events; spoken notice via `say()` only if nobody is talking; otherwise a `[sistema: …]` note on the next message | `say()` bumps the turn and would cut the audio of a turn in progress |
| MCP connections | — | The interviewer suggests servers from `agent/mcp-catalog.md`; the Architect includes them in `plan.md` and `prompt.md` | Useful recommendations without the fast model inventing names |
| Settings | `claude_model`, `effort` | Plus `architect_model` (`sonnet` · `opus`) and `architect_effort` (`medium`…`max`); env vars `PROMETEO_ARCHITECT_MODEL`, `PROMETEO_ARCHITECT_EFFORT` | The old keys still mean the interviewer: saved settings don't break |
| Prompt and skill language | Spanish | **Kept in Spanish** | English saves ~15–30 % tokens, but the prompts are short and cached, the subscription is used (limits, not money), and translating risks English answers that Kokoro would read; the frontend uses the skill names |

Tested against a test backend on `:8799` over WebSocket (text): see latencies in [[07 Phases and roadmap]]. Interrupting during a handoff doesn't stop the Architect.

## Home buttons and comet cursor (2026-11-09)

| Topic | Before | Now | Why |
|---|---|---|---|
| Home labels | Fixed **START** and **OPEN PJ.** in both languages | Translated via `t('start')` and `t('openProject')`: **EMPEZAR / START** and **ABRIR PROYECTO / OPEN PROJECT** | Consistent with the ES/EN switch; «OPEN PJ.» was unclear. Spanish uses EMPEZAR so it doesn't repeat COMENZAR from first-time setup |
| Comet pull | 12 % shift towards the button centre, uncapped | Same 12 %, **capped at 4 px** (`MAX_PULL` in `ui/CometCursor.tsx`) | On wide project cards the comet was drawn ~40–50 px left of the real pointer: the trash button was hard to hit and the comet jumped on arrival |

> [!tip] Lesson
> With the native cursor hidden (`cursor: none`), any visual offset of the drawn cursor must be small and bounded; otherwise what you see and where you click stop matching.

## Local models, turn mode and better transcription (2026-11-09)

| Topic | Before | Now | Why |
|---|---|---|---|
| Model providers | Claude only (subscription) | Each of the three model slots (`claude_model` = interviewer, `architect_model`, `title_model`) accepts `haiku`/`sonnet`/`opus` **or** `local:<LM Studio id>` | Run fully offline / without spending subscription limits |
| How local models plug in | — | LM Studio serves an **Anthropic-compatible API** on `localhost:1234`; `local.prepare()` passes `ANTHROPIC_BASE_URL` etc. through the SDK's per-session `env` (never `os.environ`) | Same Claude Agent SDK code path for both; Claude sessions in the same process stay on Claude |
| Background "haiku" calls | — | `ANTHROPIC_DEFAULT_{HAIKU,SONNET,OPUS}_MODEL` and `ANTHROPIC_SMALL_FAST_MODEL` point at the local model; non-essential traffic disabled | Claude Code's side calls would otherwise hit a model LM Studio doesn't have |
| Context length | — | `local_context` (8K…64K, default 32K); the model is unloaded/reloaded if LM Studio auto-loaded it with less | LM Studio's auto-load uses 8K, too small for the system prompt + skills |
| Resuming sessions | `resume=session_id` | Only if `session_backend` / `architect_backend` in `meta.json` matches the current provider; otherwise the agent is told to re-read `conversacion.md` | Local reasoning blocks have no valid Claude signature and vice versa |
| Model list | — | `GET /api/local-models` (LLMs only, ~1.5 s timeout); **LOCAL** option in Ajustes → Cerebro | Pick any model downloaded in LM Studio (`~/.lmstudio/models`) |
| Turn mode | VAD always decides when you've finished | `auto` (VAD) or `manual`: chunks are buffered and sent joined (0.2 s gaps) when you press **TERMINAR**; stored in `localStorage` (`prometeo.turnMode`) | Long thinking pauses no longer cut you off |
| Whisper accuracy | `beam_size=1`, no prompt | `beam_size` 5 on GPU / 3 on CPU, Spanish `initial_prompt` with project vocabulary; `large-v3-turbo` added (multilingual models only) | Better Spanish and technical words; the prompt echo on noise is filtered |

> [!warning] VRAM
> Every distinct local model takes its own GPU memory. With 8 GB (RTX 4060), use the **same** local model for all slots, and remember Whisper and Kokoro also live on the GPU.

## Vault language (2026-11-09)
This vault was switched from Spanish to English (notes, file names, frontmatter fields) at the user's request: it is context for Claude, and English is what Claude reads best. The app, its prompts and skills stay in Spanish.

## Details that improve the feel of the conversation
- Claude's text is split into sentences and each sentence becomes speech as soon as it's complete. The first sentence is cut at a comma to start sooner.
- Before a tool call the pending sentence is flushed; if a skill or `encargar_entregables` starts with no prior text, Prometeo says «Vale, me pongo con ello».
- While Prometeo speaks, the VAD threshold rises so it doesn't interrupt itself. **Headphones** are still better.
- Typical whisper hallucinations on noise are filtered («Gracias», «amara.org»).
- Claude's writes are confined to `projects/<slug>/` via a `PreToolUse` hook.
- Claude Code user settings aren't loaded (`setting_sources=[]`), so the user's `~/.claude/CLAUDE.md` doesn't affect Prometeo.

Related: [[01 Architecture]] · [[07 Phases and roadmap]]
