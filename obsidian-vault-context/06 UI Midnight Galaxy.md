---
tags: [prometeo, ui, diseño]
---
# UI — Midnight Galaxy

Figma: https://www.figma.com/design/ieSA764l6YXaKg9c4LgdYO

## Vistas
| Vista | Cuándo | Contenido |
|---|---|---|
| **01 · Primera vez — Comenzar** | Primera ejecución (`voice.md` sin configurar) | Reactor *Despertar* (aura de picos) + botón **COMENZAR** |
| **02 · Definir voz** | Tras pulsar COMENZAR | Reactor *Escuchando* (aura suave), estado arriba a la derecha y subtítulo de Prometeo |
| **03 · Inicio** | Siguientes visitas | Reactor *Reposo* + **START** (conversación nueva) y **OPEN PJ.** (abrir proyecto) |
| 04 · Conversación | Tras START | Implementada en código (falta en Figma): reactor, transcripción, caja de texto y panel de entregables |
| 05 · Proyectos | Tras OPEN PJ. | Implementada en código (falta en Figma): lista de proyectos |

Cabecera común: wordmark **PROMETEO** arriba a la izquierda + switch **ES | EN**; estado arriba a la derecha.

> [!note] Figma desactualizado
> Las vistas de Figma siguen con el nombre ORION y los botones antiguos.

## Tokens
| Token | Valor |
|---|---|
| `color/bg` | `#02030A` |
| `color/cyan` | `#4FD1FF` |
| `color/blue` | `#1E6BFF` |
| `color/text` | `#D8F4FF` |
| Títulos / botones | Orbitron |
| Texto corrido | Inter Light |

## Reactor: estados y animación
- **Despertar / idle**: respiración lenta, latido cada ~1,2 s y aura de picos que se ondula.
- **Escuchando**: los anillos reaccionan al volumen del micrófono.
- **Pensando**: rotación rápida y partículas orbitando.
- **Hablando**: el núcleo pulsa con la amplitud del TTS (AnalyserNode).

## Botones cósmicos — `ui/CosmicButton.tsx`
START, OPEN PJ. y COMENZAR. Solo CSS (`index.css`, sección «Botones cósmicos»):
- Borde con `conic-gradient` cyan → azul → violeta que gira (`@property --angle`, 6 s).
- Nebulosa interior (radial-gradients) y micro-estrellas que titilan y derivan.
- Glow exterior que late **sincronizado con el reactor** (doble pulso cada 1,2 s, `@property --glow`).
- Destello diagonal (*shine*) cada ~4,2 s.
- START es primario (`--i: 1`); OPEN PJ. secundario (`--i: 0.55`), mismo lenguaje visual.

## Cursor cometa — `ui/CometCursor.tsx`
- Canvas a pantalla completa (`z-index: 50`, `pointer-events: none`), animado con `requestAnimationFrame`, sin re-renders de React.
- Cabeza blanco-cyan con halo que late como el reactor; cola que se alarga con la velocidad; chispas al moverse y alguna en reposo.
- Sobre inputs: cursor de texto nativo y cometa reducido. Solo con `pointer: fine` (en táctil no aparece).
- `prefers-reduced-motion`: solo la cabeza, sin cola ni chispas. Se pausa con la pestaña oculta.

## Interacción cursor ↔ botones — `ui/cosmic.ts`
Un único listener delegado en el documento:
- Luz bajo el cursor: variables `--mx` / `--my` → `radial-gradient` dentro del botón.
- **Magnetismo**: el botón cósmico más cercano (radio 80 px) se desplaza unos px hacia el cursor y vuelve con *spring*; al acercarse se activa un anillo rápido y brillante.
- Click: onda (*ripple*) desde el punto de click + ráfaga de chispas del cometa.
- Versión suave en `.btn.small`, tarjetas de proyecto, `.iconbtn` y pestañas.
- `cursorBus` comunica botón bajo el cursor y ráfagas al cometa sin acoplarlos (el cometa se siente atraído hacia el centro del botón).

## Idioma de la interfaz — `src/i18n.ts`
- Switch **ES | EN** junto al wordmark. Solo cambia la interfaz: **la voz, el agente y la transcripción siguen en español**.
- i18n propio sin librería: `t('clave')`, diccionarios `es` / `en`; persiste en `localStorage` (`prometeo.lang`) y actualiza `<html lang>`. Por defecto, español.
- En inglés se muestra «Voice: Spanish only (for now)». COMENZAR → START; START y OPEN PJ. no cambian.

Librerías: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `react-markdown`.

Relacionado: [[09 Prompts de logotipo]] · [[01 Arquitectura]]
