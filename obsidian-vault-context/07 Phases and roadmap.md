---
tags: [prometeo, roadmap]
actualizado: 2026-11-09
---
# Fases y roadmap

- [x] **F0 – Base**: monorepo, uv + Vite, Agent SDK respondiendo con la suscripción (sin API key) ✅
- [x] **F1 – Cerebro por texto**: `brain.py`, `agent.md`, `projects.py`, chat por WebSocket, crear y reanudar proyectos ✅
- [x] **F2 – Pipeline de voz**: VAD en el navegador → whisper → Claude en streaming → Kokoro por frases, con barge-in ✅
- [x] **F3 – UI galaxia**: 5 vistas, reactor 3D audio-reactivo con 4 estados, nebulosa y estrellas ✅
- [x] **F4 – Skills y entregables**: 4 skills, panel con pestañas, copiar y descargar `.md` ✅
- [x] **F4.5 – Rebrand PROMETEO + UI**: nombre nuevo, botones cósmicos, cursor cometa, interacción con el cursor y switch ES/EN de la interfaz ✅ → [[06 UI Midnight Galaxy]]
- [ ] **F5 – Voz personalizable**: Chatterbox (clonación), editor de `voice.md` en la UI, botón "probar voz"

## Latencias medidas (CPU Intel, sin GPU)
| Paso | Tiempo |
|---|---|
| Saludo (frase fija) | ~1,5 s |
| STT whisper `base` (frase de 4 s) | ~1 s |
| Primera palabra de Prometeo tras un mensaje | ~3,5–4 s |
| Primera palabra al pedir entregables | ~4 s; el archivo completo tarda 20–40 s |

## Pendiente / ideas
- [x] Renombrar repo y vault · subido a GitHub (público): https://github.com/manuelgraya/prometeo
- [ ] Comprobar de oído cómo pronuncia Kokoro «Prometeo»
- [ ] Voz en inglés (el switch EN solo traduce la interfaz)
- [ ] Actualizar Figma: nombre PROMETEO, botones cósmicos, switch de idioma
- [ ] Diseñar en Figma las vistas 04 · Conversación y 05 · Proyectos (ya están implementadas en código)
- [ ] Modo "pulsar para hablar" (barra espaciadora) como alternativa al manos libres
- [ ] Skill `exportar-a-obsidian`: copiar los entregables a este vault
- [ ] Logo definitivo → [[09 Prompts de logotipo]]

Relacionado: [[10 Decisiones de implementación]] · [[PROMETEO]]
