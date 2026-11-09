---
tags: [prometeo, ui, design]
updated: 2026-11-09
---
# UI — Midnight Galaxy

Figma: https://www.figma.com/design/ieSA764l6YXaKg9c4LgdYO

UI labels below are the Spanish ones shown by default (EN equivalents in `i18n.ts`).

## Views
| View | When | Content |
|---|---|---|
| **01 · First time — Comenzar** | First run on that machine (no `configured` in `settings.local.json`) | *Despertar* (awakening) reactor with a spiky aura + **COMENZAR** and **ELEGIR VOZ** |
| **02 · Definir voz** (voice setup) | After pressing COMENZAR | *Escuchando* (listening) reactor with a soft aura, status top right, Prometeo's caption, **VER VOCES** and **SALTAR** buttons |
| **03 · Inicio** (home) | Later visits | *Reposo* (rest) reactor + **EMPEZAR / START** (new conversation) and **ABRIR PROYECTO / OPEN PROJECT** |
| 04 · Conversación | After EMPEZAR | In code only (missing in Figma): reactor, transcript, text box and deliverables panel |
| 05 · Proyectos | After ABRIR PROYECTO | In code only (missing in Figma): project list with a trash button and in-card confirmation |
| 06 · Voces | Navigation or ELEGIR VOZ | In code only: one card per voice (native / accented) with ESCUCHAR and USAR, shared speed. The reactor switches to *speaking* during a sample |
| 07 · Ajustes (settings) | Navigation | In code only: sections Voz, Rendimiento (CPU/GPU, Whisper), Cerebro (model, effort), Interfaz (language) and Primera configuración. Segmented controls (`.seg`) |

Shared header: **PROMETEO** wordmark + navigation **Inicio · Proyectos · Voces · Ajustes** top left; **ES | EN** switch fixed top right (`.langswitch`, outside `.topleft`); status (project · listening) just left of the switch (`.status { right: 196px }`). Under 760 px wide the switch goes to the corner (16 px), the status drops below it (`top: 84px`) and toasts move down to `top: 112px`; `.inputbar input` has `min-width: 0` so the text box can shrink. Routes `#/inicio`, `#/proyectos`, `#/voces`, `#/ajustes`, `#/voz`, `#/comenzar`, `#/conversacion[/slug]`; browser back/forward work. A new conversation only goes into the URL once the user has said something, because empty projects are deleted on exit.

> [!note] Figma is out of date
> The Figma views still use the ORION name and the old buttons.

## Tokens
| Token | Value |
|---|---|
| `color/bg` | `#02030A` |
| `color/cyan` | `#4FD1FF` |
| `color/blue` | `#1E6BFF` |
| `color/text` | `#D8F4FF` |
| Headings / buttons | Orbitron |
| Body text | Inter Light |

## Reactor: states and animation
- **Awakening / idle**: slow breathing, a beat every ~1.2 s and a rippling spiky aura.
- **Listening**: rings react to microphone volume.
- **Thinking**: fast rotation and orbiting particles.
- **Speaking**: the core pulses with TTS amplitude (AnalyserNode).

## Cosmic buttons — `ui/CosmicButton.tsx`
EMPEZAR, ABRIR PROYECTO and COMENZAR. CSS only (`index.css`, section «Botones cósmicos»):
- Border with a rotating cyan → blue → violet `conic-gradient` (`@property --angle`, 6 s).
- Inner nebula (radial-gradients) and twinkling, drifting micro-stars.
- Outer glow that beats **in sync with the reactor** (double pulse every 1.2 s, `@property --glow`).
- Diagonal *shine* every ~4.2 s.
- EMPEZAR is primary (`--i: 1`); ABRIR PROYECTO secondary (`--i: 0.55`), same visual language.

## Comet cursor — `ui/CometCursor.tsx`
- Full-screen canvas (`z-index: 50`, `pointer-events: none`), animated with `requestAnimationFrame`, no React re-renders.
- White-cyan head with a halo that beats like the reactor; tail that lengthens with speed; sparks when moving and occasionally at rest.
- Pull towards the centre of the hovered button **capped at 4 px** (`MAX_PULL`): the comet never drifts away from the real click point.
- Over inputs: native text cursor and a smaller comet. Only with `pointer: fine` (absent on touch).
- `prefers-reduced-motion`: head only, no tail or sparks. Pauses while the tab is hidden.

## Cursor ↔ buttons interaction — `ui/cosmic.ts`
A single delegated listener on the document:
- Light under the cursor: `--mx` / `--my` variables → `radial-gradient` inside the button.
- **Magnetism**: the nearest cosmic button (80 px radius) shifts a few px towards the cursor and springs back; on approach a fast bright ring lights up.
- Click: *ripple* from the click point + a burst of comet sparks.
- Softer version on `.btn.small`, project cards, `.iconbtn`, tabs, `.nav button` and `.seg button`.
- `cursorBus` tells the comet about the hovered button and bursts without coupling them (the comet is drawn towards the button centre, at most 4 px).

## Interface language — `src/i18n.ts`
- **ES | EN** selector in two places: the header switch, top right (`LangSwitch` in `App.tsx`), and **Ajustes → Interfaz** (`Segmented`). Both use the same `lang` state. It used to sit next to the wordmark inside `.topleft`. Only the interface changes: **voice, agent and transcription stay in Spanish**.
- Home-grown i18n, no library: `t('key')`, `es` / `en` dictionaries; persisted in `localStorage` (`prometeo.lang`) and updates `<html lang>`. Spanish by default.
- In English it shows «Voice: Spanish only (for now)». Buttons: COMENZAR → START, EMPEZAR → START, ABRIR PROYECTO → OPEN PROJECT (keys `begin`, `start`, `openProject`).

Libraries: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `react-markdown`.

Related: [[09 Logo prompts]] · [[01 Architecture]]
