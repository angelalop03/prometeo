import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mic } from './audio/mic'
import { VoicePlayer } from './audio/player'
import { t } from './i18n'
import type { Energy } from './scene/Scene'

export interface Artifact { name: string; content: string; mtime: number }
export interface ProjectMeta { slug: string; title: string; created: string; updated: string; artifacts?: string[] }
export interface Msg { role: 'user' | 'agent'; text: string; tools: string[] }

let player: VoicePlayer | null = null
let micPromise: Promise<Mic> | null = null
function getMic() {
  micPromise ??= import('./audio/mic').then(({ Mic }) => new Mic())
  return micPromise
}
/** Debe llamarse desde un gesto del usuario (clic) para desbloquear el audio. */
export async function unlockAudio() {
  player ??= new VoicePlayer()
  await player.unlock()
  return player
}

const TOOL_LABELS: Record<string, () => string> = {
  'prometeo:crear-prompt': () => t('tool.crear-prompt'),
  'prometeo:documentar-plan': () => t('tool.documentar-plan'),
  'prometeo:desglosar-tareas': () => t('tool.desglosar-tareas'),
  'prometeo:resumen-notas': () => t('tool.resumen-notas'),
  mcp__prometeo__set_project_title: () => t('tool.title'),
  mcp__prometeo__set_voice: () => t('tool.voice'),
  mcp__prometeo__finish_voice_setup: () => t('tool.voiceSaved'),
}

export function useSession(opts: { mode: 'voz' | 'plan'; project?: string | null; enabled: boolean }) {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [serverState, setServerState] = useState<'idle' | 'thinking' | 'speaking' | 'listening'>('idle')
  const [playing, setPlaying] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [project, setProject] = useState<ProjectMeta | null>(null)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [voiceDone, setVoiceDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ws = useRef<WebSocket | null>(null)
  const turn = useRef(0)
  const minTurn = useRef(0)
  const pendingAudioTurn = useRef<number | null>(null)

  const send = useCallback((data: object | ArrayBuffer) => {
    const s = ws.current
    if (s?.readyState !== WebSocket.OPEN) return
    s.send(data instanceof ArrayBuffer ? data : JSON.stringify(data))
  }, [])

  /** Barge-in: la persona habla mientras PROMETEO habla o piensa. */
  const interrupt = useCallback(() => {
    player?.stop()
    minTurn.current = turn.current + 1
    send({ type: 'interrupt' })
  }, [send])

  const appendAgent = (fn: (m: Msg) => Msg) =>
    setMessages((ms) => {
      const last = ms[ms.length - 1]
      if (last?.role === 'agent') return [...ms.slice(0, -1), fn(last)]
      return [...ms, fn({ role: 'agent', text: '', tools: [] })]
    })

  useEffect(() => {
    if (!opts.enabled) return
    const p = player
    if (p) p.onPlayingChange = (on) => {
      setPlaying(on)
      void micPromise?.then((m) => m.setStrict(on))
    }
    const q = new URLSearchParams({ mode: opts.mode })
    if (opts.project) q.set('project', opts.project)
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const sock = new WebSocket(`${proto}://${location.host}/ws?${q}`)
    sock.binaryType = 'arraybuffer'
    ws.current = sock
    sock.onopen = () => setConnected(true)
    sock.onclose = () => setConnected(false)
    sock.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) {
        const t = pendingAudioTurn.current
        pendingAudioTurn.current = null
        if (t !== null && t >= minTurn.current) player?.enqueue(e.data)
        return
      }
      const d = JSON.parse(e.data)
      switch (d.type) {
        case 'ready':
          setProject(d.project)
          if (d.project) fetch(`/api/projects/${d.project.slug}`).then((r) => r.json()).then((p) => {
            setArtifacts(p.artifacts)
            // Historial previo (conversacion.md) al reanudar un proyecto
            const prev = parseConversation(p.conversation)
            setMessages((ms) => [...prev.filter((p) => !ms.some((m) => m.text.trim() === p.text.trim())), ...ms])
          }).catch(() => {})
          break
        case 'turn_start':
          turn.current = d.turn
          setMessages((ms) => [...ms, { role: 'agent', text: '', tools: [] }])
          break
        case 'audio':
          pendingAudioTurn.current = d.turn
          break
        case 'delta':
          appendAgent((m) => ({ ...m, text: m.text + d.text }))
          break
        case 'tool': {
          const label = (TOOL_LABELS[d.skill ?? ''] ?? TOOL_LABELS[d.name])?.() ?? (d.file ? t('tool.writing', { file: d.file }) : null)
          if (label) appendAgent((m) => ({ ...m, tools: [...m.tools, label] }))
          break
        }
        case 'transcript':
          setMessages((ms) => {
            // El transcript va antes de la respuesta de PROMETEO que empieza después.
            const last = ms[ms.length - 1]
            const base = last?.role === 'agent' && !last.text ? ms.slice(0, -1) : ms
            return [...base, { role: 'user', text: d.text, tools: [] }]
          })
          break
        case 'state':
          setServerState(d.state)
          break
        case 'turn_end':
          setServerState('idle')
          setMessages((ms) => ms.filter((m) => m.text || m.tools.length))
          break
        case 'project':
          setProject(d.project)
          break
        case 'artifacts':
          setArtifacts(d.artifacts)
          break
        case 'voice_setup_done':
          setVoiceDone(true)
          break
        case 'error':
          setError(d.message)
          setTimeout(() => setError(null), 6000)
          break
      }
    }
    return () => {
      sock.close()
      player?.stop()
    }
  }, [opts.enabled, opts.mode, opts.project])

  // Micrófono: singleton de módulo; cada sesión solo cambia los callbacks.
  const enableMic = useCallback(async () => {
    try {
      const m = await getMic()
      m.setCallbacks({
        // Barge-in solo si PROMETEO está hablando; si está pensando, esperamos a la transcripción.
        onSpeechStart: () => { if (player?.playing) interrupt() },
        onUtterance: (audio) => send(audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength) as ArrayBuffer),
      })
      await m.start()
      setMicOn(true)
      setMicError(null)
    } catch (e) {
      setMicError(t('micError'))
      console.error(e)
    }
  }, [interrupt, send])

  const disableMic = useCallback(async () => {
    await (await getMic()).pause()
    setMicOn(false)
  }, [])

  // Al salir de la vista, el micrófono se pausa (no se destruye).
  useEffect(() => () => { void micPromise?.then((m) => m.pause()) }, [])

  const sendText = useCallback((text: string) => {
    if (!text.trim()) return
    if (player?.playing) interrupt()
    setMessages((ms) => [...ms, { role: 'user', text, tools: [] }])
    send({ type: 'text', text })
  }, [interrupt, send])

  const energy: Energy = playing ? 'speaking' : serverState === 'thinking' ? 'thinking' : micOn ? 'listening' : 'idle'

  return { connected, messages, energy, micOn, micError, enableMic, disableMic, sendText, interrupt, project, artifacts, voiceDone, playing, error }
}

/** Convierte conversacion.md («**Tú** (12:00): …») en mensajes. */
function parseConversation(md: string): Msg[] {
  const out: Msg[] = []
  for (const line of md.split('\n')) {
    const m = line.match(/^\*\*(Tú|PROMETEO|ORION)\*\* \([^)]*\): (.*)$/)
    if (m) out.push({ role: m[1] === 'Tú' ? 'user' : 'agent', text: m[2], tools: [] })
  }
  return out
}
