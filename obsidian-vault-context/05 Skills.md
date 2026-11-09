---
tags: [prometeo, skills]
updated: 2026-11-09
---
# Skills

Each skill is a folder `agent/skills/<name>/SKILL.md` in the Claude Agent SDK format (contents in Spanish). Skills **write files** and are used only by the **Architect** (Opus, background). The interviewer no longer invokes them: it hands off deliverables with `encargar_entregables` → [[03 Agent (agent.md)]].

| Skill | Output | Content |
|---|---|---|
| `crear-prompt` | `prompt.md` | Optimised prompt for another AI: role, context, task, constraints, output format |
| `documentar-plan` | `plan.md` | Context, goals, scope, phases, risks, next step |
| `desglosar-tareas` | `tareas.md` | Prioritised checklist with estimates |
| `resumen-notas` | `notas.md` | Decisions made and open questions |

`plan.md` also includes a **Conexiones MCP recomendadas** (recommended MCP connections) section when the interviewer suggested any.

Future ideas: `diagrama-mermaid`, `estimar-coste`, `exportar-a-obsidian`.

Related: [[03 Agent (agent.md)]]
