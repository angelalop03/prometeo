---
tags: [prometeo, skills]
---
# Skills

Cada skill es una carpeta `agent/skills/<nombre>/SKILL.md` en el formato del Claude Agent SDK. Las skills **escriben archivos**; Prometeo solo dice en voz alta que el documento está listo.

| Skill | Salida | Contenido |
|---|---|---|
| `crear-prompt` | `prompt.md` | Prompt optimizado para otra IA: rol, contexto, tarea, restricciones, formato de salida |
| `documentar-plan` | `plan.md` | Contexto, objetivos, alcance, fases, riesgos, siguiente paso |
| `desglosar-tareas` | `tareas.md` | Checklist priorizado con estimaciones |
| `resumen-notas` | `notas.md` | Decisiones tomadas y preguntas abiertas |

Ideas futuras: `diagrama-mermaid`, `estimar-coste`, `exportar-a-obsidian`.

Relacionado: [[03 Agente (agent.md)]]
