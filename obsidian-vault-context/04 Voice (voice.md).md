---
tags: [prometeo, voz]
---
# Voz — `voice.md`

En la **primera ejecución** la voz se define conversando en la vista *Definir voz*. Prometeo propone opciones y el resultado se guarda en `voice.md`. Después se puede editar.

```yaml
---
engine: kokoro          # kokoro | chatterbox | piper
voice: em_alex          # voz masculina española de Kokoro (alternativa: ef_dora)
language: es
speed: 1.05
configured: false       # true tras completar "Definir voz"
# chatterbox (F5): reference_audio: agent/voices/prometeo.wav
---
Notas de estilo: tono grave, sereno, ritmo ágil.
```

> [!note] Hardware
> Sin GPU NVIDIA, Chatterbox (clonación de voz) irá lento en CPU. Kokoro va bien en CPU.

Relacionado: [[08 Stack de voz open source]] · [[06 UI Midnight Galaxy]]
