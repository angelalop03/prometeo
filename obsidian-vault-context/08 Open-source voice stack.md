---
tags: [prometeo, voz, investigación]
---
# Stack de voz open source

> [!info] ¿Y ElevenLabs?
> Es de pago. El plan gratuito da pocos minutos al mes y no permite uso comercial. Por eso se descartó para la v1.

| Parte | Opción | Notas |
|---|---|---|
| Voz → texto (STT) | **faster-whisper** / whisper.cpp | Muy buen español; funciona en CPU |
| Texto → voz (TTS) | **Kokoro** ✅ v1 | Modelo de 82M, licencia Apache, calidad alta, tiene español |
| | **Chatterbox** (F5) | Licencia MIT, clona voz con unos segundos de audio; necesita GPU para ir fluido |
| | Piper | Muy rápido y ligero; menos natural |
| | XTTS-v2 | Buena clonación, pero licencia no comercial |
| Detección de voz (VAD) | **Silero VAD** ✅ | Detecta inicio y fin de turno y el barge-in |
| Alternativa sin servidor | Web Speech API | Gratis; la calidad depende del navegador |

Relacionado: [[04 Voz (voice.md)]]
