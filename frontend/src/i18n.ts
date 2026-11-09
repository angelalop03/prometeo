/**
 * i18n mínimo, solo de la interfaz. La voz, el agente y la transcripción siguen en español.
 * `t()` lee el idioma actual de módulo; `useLang()` (en App) lo cambia y fuerza el re-render.
 */
import { useCallback, useState } from 'react'

export type Lang = 'es' | 'en'

const es = {
  'energy.idle': 'En espera',
  'energy.listening': 'Escuchando',
  'energy.thinking': 'Pensando',
  'energy.speaking': 'Hablando',
  home: 'Inicio',
  firstSetup: 'Primera configuración',
  begin: 'COMENZAR',
  definingVoice: 'Definiendo voz',
  voicePlaceholder: 'Describe cómo quieres que suene PROMETEO…',
  projects: 'PROYECTOS',
  back: '← VOLVER',
  loading: 'Cargando…',
  noProjects: 'Aún no hay proyectos.\nPulsa START para planificar el primero.',
  updated: 'Actualizado {date}',
  connecting: 'Conectando',
  chatPlaceholder: 'Escribe o habla con PROMETEO…',
  message: 'Mensaje',
  silence: 'Callar a PROMETEO',
  micOff: 'Silenciar micrófono',
  micOn: 'Activar micrófono (manos libres)',
  send: 'Enviar',
  transcript: 'Transcripción',
  transcriptEmpty: 'La conversación aparecerá aquí.',
  you: 'TÚ',
  deliverables: 'Entregables',
  copy: 'COPIAR',
  copied: 'COPIADO',
  deliverablesEmpty: 'Cuando cerréis el plan, pide a PROMETEO\n«dame el plan», «crea el prompt», «las tareas» o «las notas».',
  'tool.crear-prompt': 'Creando prompt…',
  'tool.documentar-plan': 'Documentando plan…',
  'tool.desglosar-tareas': 'Desglosando tareas…',
  'tool.resumen-notas': 'Resumiendo notas…',
  'tool.title': 'Título del proyecto actualizado',
  'tool.voice': 'Voz cambiada',
  'tool.voiceSaved': 'Voz guardada',
  'tool.writing': 'Escribiendo {file}…',
  micError: 'No se pudo acceder al micrófono. Puedes escribir abajo.',
  langLabel: 'Idioma de la interfaz',
  langHint: 'Idioma de la interfaz (la voz es en español)',
}

type Key = keyof typeof es

const en: Record<Key, string> = {
  'energy.idle': 'Idle',
  'energy.listening': 'Listening',
  'energy.thinking': 'Thinking',
  'energy.speaking': 'Speaking',
  home: 'Home',
  firstSetup: 'First-time setup',
  begin: 'START',
  definingVoice: 'Setting up voice',
  voicePlaceholder: 'Describe how PROMETEO should sound (in Spanish)…',
  projects: 'PROJECTS',
  back: '← BACK',
  loading: 'Loading…',
  noProjects: 'No projects yet.\nPress START to plan your first one.',
  updated: 'Updated {date}',
  connecting: 'Connecting',
  chatPlaceholder: 'Type or talk to PROMETEO (in Spanish)…',
  message: 'Message',
  silence: 'Stop PROMETEO',
  micOff: 'Mute microphone',
  micOn: 'Turn on microphone (hands-free)',
  send: 'Send',
  transcript: 'Transcript',
  transcriptEmpty: 'The conversation will appear here.',
  you: 'YOU',
  deliverables: 'Deliverables',
  copy: 'COPY',
  copied: 'COPIED',
  deliverablesEmpty: 'Once the plan is ready, ask PROMETEO (in Spanish)\n«dame el plan», «crea el prompt», «las tareas» or «las notas».',
  'tool.crear-prompt': 'Writing prompt…',
  'tool.documentar-plan': 'Documenting plan…',
  'tool.desglosar-tareas': 'Breaking down tasks…',
  'tool.resumen-notas': 'Summarizing notes…',
  'tool.title': 'Project title updated',
  'tool.voice': 'Voice changed',
  'tool.voiceSaved': 'Voice saved',
  'tool.writing': 'Writing {file}…',
  micError: "Couldn't access the microphone. You can type below.",
  langLabel: 'Interface language',
  langHint: 'Voice: Spanish only (for now)',
}

const DICTS: Record<Lang, Record<Key, string>> = { es, en }
export const LOCALES: Record<Lang, string> = { es: 'es-ES', en: 'en-GB' }
const STORAGE_KEY = 'prometeo.lang'

function initialLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'es' || v === 'en') return v
  } catch { /* almacenamiento no disponible */ }
  return 'es'
}

let current: Lang = initialLang()
document.documentElement.lang = current

export function t(key: Key, vars?: Record<string, string>): string {
  let s = DICTS[current][key]
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v)
  return s
}

export const locale = () => LOCALES[current]

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setState] = useState<Lang>(current)
  const setLang = useCallback((l: Lang) => {
    current = l
    document.documentElement.lang = l
    try { localStorage.setItem(STORAGE_KEY, l) } catch { /* sin persistencia */ }
    setState(l)
  }, [])
  return [lang, setLang]
}
