---
tags: [prometeo, voice]
updated: 2026-11-09
---
# Voice — `voice.md` and `settings.local.json`

The voice is configured **per computer**. There are two files:

| File | In git | What it stores |
|---|---|---|
| `agent/voice.md` | Yes | **Default** voice (engine, voice, language, speed). `configured: false` |
| `settings.local.json` (repo root) | No (`.gitignore`) | Voice chosen on this machine, speed, `configured`, plus performance and model settings |

`config.load_voice()` merges both: local wins, and `configured` **only** counts if it comes from the local file. So a fresh clone always goes through first-time setup. → [[10 Implementation decisions]]

```yaml
# agent/voice.md (default, versioned)
---
engine: kokoro
voice: em_santa
language: es
speed: 0.85
configured: false
---
```

## Ways to choose the voice
- **By talking** (view *Definir voz*): Prometeo uses the `set_voice` and `finish_voice_setup` tools. Buttons **VER VOCES** (see voices) and **SALTAR** (skip).
- **Catalog** (view *Voces*): each voice has **ESCUCHAR** (Prometeo introduces itself with it) and **USAR** (use); a shared speed slider (0.8–1.3). Choosing a voice here also sets `configured: true`.
- **Settings** (*Ajustes*): current voice with **PROBAR** (test), speed, **CAMBIAR VOZ**, **CONFIGURAR HABLANDO** and **REPETIR PRIMERA CONFIGURACIÓN** (sets `configured: false`).

## Catalog (Kokoro v1.0, `speech.VOICES`)
Kokoro v1.0 ships only **3 native Spanish voices**. The others read Spanish with their own language's accent (`lang="es"`).

| Id | Name | Type |
|---|---|---|
| `em_alex` | Álex | Native · male, calm and neutral |
| `em_santa` | Santa | Native · male, deep and warm (default) |
| `ef_dora` | Dora | Native · female, clear and friendly |
| `im_nicola` · `if_sara` | Nicola · Sara | Italian accent (m · f) |
| `pm_alex` · `pm_santa` · `pf_dora` | Alex · Santa (PT) · Dora (PT) | Portuguese accent (m · m · f) |
| `ff_siwis` | Siwis | French accent (f) |

Sample sentence (`speech.SAMPLE_TEXT`, Spanish): «Hola, soy Prometeo. Te ayudo a convertir ideas difusas en planes claros y accionables. ¿Empezamos?». Endpoint `GET /api/voices/{id}/sample?speed=` → WAV, cached in memory per voice and speed (~1–1.4 s the first time on CPU).

> [!note] Hardware
> Kokoro runs fine on CPU and ~6× faster on an NVIDIA GPU with `onnxruntime-gpu` (install command in the README). Whisper can also run on the GPU → [[08 Open-source voice stack]]. Chatterbox (cloning) will still need a GPU to be fluid.

Related: [[08 Open-source voice stack]] · [[06 UI Midnight Galaxy]] · [[10 Implementation decisions]]
