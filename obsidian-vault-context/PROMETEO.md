---
tags: [prometeo, moc]
creado: 2026-11-09
estado: v1-funcional
---
# PROMETEO — Agente de voz para planificar proyectos

> [!abstract] Resumen
> App web local en la que hablas (o escribes) con **Prometeo**, un agente de voz. Prometeo te hace preguntas directas hasta cerrar un plan y luego genera entregables: prompt, notas, plan `.md` y lista de tareas.
> UI estilo *midnight galaxy* con un corazón-reactor azul animado, botones cósmicos, cursor cometa y switch de idioma ES/EN (solo interfaz).

> [!info] Antes se llamaba ORION
> Renombrado a PROMETEO el 2026-11-09. Repo y vault ya renombrados.

## Decisiones tomadas
- **Voz 100 % open source y local:** faster-whisper (STT), Kokoro ONNX (TTS v1), Silero VAD en el navegador. Chatterbox más adelante para clonar voces. → [[08 Stack de voz open source]]
- **Cerebro:** Claude **Sonnet 5.5** con **tu suscripción**, vía Claude Agent SDK, que reutiliza la sesión de `claude login`. No hace falta API key.
  > [!warning] Solo uso personal
  > Si se distribuye a otros usuarios, los términos de Anthropic piden autenticar con API key.
- **Despliegue:** local / self-hosted. Los proyectos se guardan como carpetas `.md` en disco.
- **Entrada:** voz (manos libres o push-to-talk) y caja de texto.
- **Máquina de desarrollo:** Intel Iris Xe, sin GPU NVIDIA, así que la voz corre en CPU. Python 3.12 vía `uv`.

## Índice
1. [[01 Arquitectura]]
2. [[02 Estructura del repo]]
3. [[03 Agente (agent.md)]]
4. [[04 Voz (voice.md)]]
5. [[05 Skills]]
6. [[06 UI Midnight Galaxy]]
7. [[07 Fases y roadmap]]
8. [[08 Stack de voz open source]]
9. [[09 Prompts de logotipo]]
10. [[10 Decisiones de implementación]]
11. [[11 Prompt rebrand Prometeo]]

## Enlaces
- Figma, vistas UI: https://www.figma.com/design/ieSA764l6YXaKg9c4LgdYO
- Código: `/home/manuel/Work/prometeo`
- GitHub (público): https://github.com/manuelgraya/prometeo
