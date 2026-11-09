---
name: documentar-plan
description: Escribe el documento del plan (plan.md) con contexto, objetivos, alcance, fases, riesgos y siguiente paso, a partir de la conversación. Úsala cuando la persona pida el plan, la documentación o "pásalo a limpio".
---
# Documentar plan

Escribe `plan.md` en el directorio de trabajo actual con esta estructura:

```markdown
# <Título del proyecto>

## Contexto
Por qué existe este proyecto y qué problema resuelve (2-4 frases).

## Objetivos
- Objetivo medible 1
- ...

## Alcance
**Incluye:** ...
**No incluye (por ahora):** ...

## Restricciones
Plazo, presupuesto, tecnología, personas.

## Fases
### Fase 1 — <nombre>
Qué se hace y qué se entrega.
...

## Riesgos y mitigación
| Riesgo | Impacto | Mitigación |
|---|---|---|

## Decisiones tomadas
- ...

## Siguiente paso
La acción concreta más pequeña para empezar mañana.
```

Usa solo información de la conversación; si falta algo importante, márcalo como `**Pendiente:** ...` en vez de inventarlo.
Si ya existe `plan.md`, actualízalo.

En la respuesta hablada, di en una frase que el plan está listo.
