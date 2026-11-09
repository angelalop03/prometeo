---
tags: [prometeo, voice, research]
updated: 2026-11-09
---
# Open-source voice stack

> [!info] What about ElevenLabs?
> It's paid. The free plan gives few minutes per month and doesn't allow commercial use, so it was ruled out for v1.

| Part | Option | Notes |
|---|---|---|
| Speech → text (STT) | **faster-whisper** / whisper.cpp | Very good Spanish; runs on CPU. On an NVIDIA GPU (`float16`) with `nvidia-cublas-cu12` + `nvidia-cudnn-cu12` in the venv: ~10× faster |
| Text → speech (TTS) | **Kokoro** ✅ v1 | 82M model, Apache licence, high quality; 3 native Spanish voices (plus 6 accented ones used in the catalog). GPU with `onnxruntime-gpu[cuda,cudnn]` installed on top of `onnxruntime`: ~6× faster |
| | **Chatterbox** (F5) | MIT licence, clones a voice from a few seconds of audio; needs a GPU to be fluid |
| | Piper | Very fast and light; less natural |
| | XTTS-v2 | Good cloning, but non-commercial licence |
| Voice activity detection (VAD) | **Silero VAD** ✅ | Detects turn start/end and barge-in |
| Serverless alternative | Web Speech API | Free; quality depends on the browser |

Related: [[04 Voice (voice.md)]]
