---
tags: [prometeo, prompt]
creado: 2026-11-09
---
# Prompt: rebrand a PROMETEO + mejoras de UI

> [!info] Uso
> Pegar en Claude Code con el directorio de trabajo en `/home/manuel/Work/prometeo`.

```markdown
Trabajas en el repo `/home/manuel/Work/prometeo` (backend FastAPI + Claude Agent SDK en `backend/app/`,
agente en `agent/`, frontend Vite + React + TS en `frontend/src/`; la UI está en `App.tsx` e `index.css`,
la escena 3D en `scene/Scene.tsx`). Contexto completo en la vault `~/Documentos/ORION`.
Haz estos 5 cambios, en este orden, y verifica cada uno en el navegador antes de seguir.

## 1. Rebrand ORION → PROMETEO
- Nombre visible: **PROMETEO**. Todo lo que diga "ORION" pasa a "PROMETEO" (wordmark, `<title>`, placeholders, "Callar a…", etiqueta `who`
  en la transcripción, textos vacíos, README, comentarios).
- Agente: `agent/agent.md` (frontmatter `name` y "Eres **PROMETEO**"), `agent/modes/definir-voz.md`,
  `agent/voice.md`, saludo de `backend/app/main.py`, `FastAPI(title=…)`, logger.
- Identificadores: plugin `agent/.claude-plugin/plugin.json` → `"name": "prometeo"`, así que las skills pasan a
  `prometeo:crear-prompt`, etc. (`brain.py` → `PROMETEO_SKILLS`); servidor MCP `"prometeo"` y
  `allowed_tools` `mcp__prometeo__*`; actualiza el mapa de etiquetas de herramientas en `session.ts`.
- Variables de entorno: `PROMETEO_MODEL`, `PROMETEO_EFFORT`, `PROMETEO_WHISPER_MODEL`, `PROMETEO_STT_THREADS`,
  `PROMETEO_ROOT`, **leyendo la `ORION_*` antigua como fallback**. Actualiza la tabla del README y `run.sh`.
- Paquetes: `orion-frontend` → `prometeo-frontend`, `orion-backend` → `prometeo-backend`
  (renombra `backend/src/orion_backend` y regenera `uv.lock` con `uv lock`).
- Tipo de mensaje: `role: 'orion'` → `role: 'agent'` en `session.ts`/`App.tsx`.
- **Compatibilidad**: los proyectos existentes en `projects/*/conversacion.md` tienen líneas `**ORION** (...)`.
  El parser de `session.ts` (regex `^\*\*(Tú|ORION)\*\*`) y `projects.py` deben aceptar `ORION` y
  `PROMETEO`; los nuevos se escriben como `PROMETEO`. No reescribas los proyectos existentes.
- NO renombres la carpeta del repo ni la vault (lo haré yo a mano). Al acabar,
  `grep -rni orion` fuera de `node_modules`, `dist`, `.venv`, `projects` y lockfiles solo debe devolver los
  fallbacks de compatibilidad.

## 2. Botones START / OPEN PJ. (y COMENZAR) más vistosos, cósmicos y brillantes
Estética *midnight galaxy* (tokens: bg `#02030A`, cyan `#4FD1FF`, blue `#1E6BFF`, text `#D8F4FF`, Orbitron).
- Borde con gradiente animado cyan → azul → violeta tenue (`conic-gradient` + `@property --angle` girando),
  vía máscara/pseudo-elemento para que el fondo siga siendo cristal oscuro (`backdrop-filter`).
- Fondo interior con nebulosa sutil (radial-gradients) y un campo de micro-estrellas (pseudo-elemento con
  `radial-gradient` repetido) que titilan lentamente.
- Glow exterior respirando (sincronizado con el latido ~1,2 s del reactor) y un destello (*shine sweep*)
  diagonal que cruza el botón cada ~4 s.
- Texto con `text-shadow` luminoso. START es el primario (más intenso); OPEN PJ. secundario (mismo lenguaje,
  menos saturado). Aplica el mismo componente a COMENZAR.
- Solo CSS (sin librerías), con todo en clases reutilizables en `index.css`. Mantén accesibilidad: foco visible
  con `:focus-visible` y contraste del texto.

## 3. Cursor cometa
- Oculta el cursor nativo en escritorio (`cursor: none` solo con `@media (pointer: fine)`; en táctil no hay cometa).
- Componente `CometCursor.tsx`: cabeza brillante (núcleo blanco-cyan + halo) que sigue al puntero con un leve
  *easing*, y una **cola** de partículas/segmentos que se desvanece y se estrecha según la velocidad
  (más rápido = cola más larga). Implementa con un `<canvas>` a pantalla completa, `position: fixed`,
  `pointer-events: none`, z-index por encima de `.layer`, animado con `requestAnimationFrame`
  (sin re-renders de React por frame, todo en refs). Usa `devicePixelRatio`.
- En reposo, la cabeza late suave y suelta alguna chispa ocasional.
- Sobre inputs de texto, muestra el caret normal (`cursor: text`) y oculta la cola o reduce el cometa.
- Respeta `prefers-reduced-motion`: cursor simple, sin cola.
- Rendimiento: nada de más de ~1 ms por frame; pausa el bucle cuando la pestaña está oculta.

## 4. Interacción botones ↔ cursor
- Los botones exponen la posición del cursor en variables CSS (`--mx`, `--my`) en `pointermove`; un
  `radial-gradient` en esa posición ilumina el interior como si el cometa lo alumbrara.
- Efecto magnético: el botón se desplaza unos px hacia el cursor al acercarse (≈ 80 px de radio) y vuelve con
  spring al salir. El cometa se ve atraído/acelerado hacia el centro del botón al hacer hover.
- Hover: el borde gira más rápido y el glow se intensifica. Click: onda expansiva (*ripple*) desde el punto de
  click + ráfaga de chispas del cometa.
- Haz un hook reutilizable `useCosmicButton` (o un componente `<CosmicButton>`) y úsalo en START, OPEN PJ.,
  COMENZAR; aplica una versión suave a `.btn.small`, `.card` de proyectos e `.iconbtn`.
- Comunica cursor ↔ botones sin acoplarlos: por ejemplo, un pequeño store/evento (`hover-target`) que el
  `CometCursor` escucha.

## 5. Switch de idioma ES / EN (solo UI)
- Solo cambia la interfaz. **La voz, el agente (`agent.md`), el STT (whisper `language`) y el TTS siguen en
  español**; no toques el backend para esto.
- i18n ligero propio, sin librería: `frontend/src/i18n.ts` con diccionarios `es`/`en`, un contexto
  `useT()` y la función `t('clave')`. Extrae TODAS las cadenas de UI: estados (`En espera/Idle`,
  `Escuchando/Listening`, `Pensando/Thinking`, `Hablando/Speaking`), "Primera configuración", "PROYECTOS",
  "← VOLVER", "Cargando…", vacíos, "Transcripción", "Entregables", COPIAR/COPIADO, placeholders, `title`s
  de los botones, etiquetas de herramientas de `session.ts`, "TÚ/YOU", `toLocaleString` (`es-ES`/`en-GB`).
  START y OPEN PJ. se quedan igual en ambos idiomas; COMENZAR → START en inglés.
- Switch `ES | EN` en la esquina (junto al wordmark o al estado), con el mismo estilo HUD/Orbitron;
  persiste en `localStorage` (con try/catch) y actualiza `<html lang>`. Por defecto, español.
- En el switch o su tooltip, en inglés, aclara: "Voice: Spanish only (for now)".

## Verificación
- `npm run build` y `oxlint` sin errores; `uv run` del backend arranca.
- Abre la app con `./run.sh` y revisa las vistas con los atajos `#view=inicio`, `#view=voz`,
  `#view=proyectos`, `#view=conversacion`, en ES y EN, en escritorio y a 390 px de ancho.
- Abre un proyecto antiguo y comprueba que la transcripción con `ORION` sigue cargando.
- Prueba una conversación corta: las skills `prometeo:*` se invocan y la voz sigue sonando en español.
- Haz un commit por cada punto (1 a 5).
```

Relacionado: [[06 UI Midnight Galaxy]] · [[10 Decisiones de implementación]]

## Estado (2026-11-09): ejecutado
Commits en `/home/manuel/Work/prometeo`:
- `836cc8d` Renombra ORION a PROMETEO. En los textos hablados se escribe «Prometeo» para que el TTS no lo deletree.
- `aa99c18` Botones cósmicos (`ui/CosmicButton.tsx`), cursor cometa (`ui/CometCursor.tsx`) e interacción (`ui/cosmic.ts`).
- `d82dc83` Switch ES/EN de la interfaz (`src/i18n.ts`); la voz sigue en español.

Pendiente a mano: renombrar la carpeta del repo y esta vault.
