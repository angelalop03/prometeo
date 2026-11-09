import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Scene, { type Energy, type ReactorProps } from './scene/Scene'
import CometCursor from './ui/CometCursor'
import CosmicButton from './ui/CosmicButton'
import { installCosmicInteractions } from './ui/cosmic'
import { locale, t, useLang, type Lang } from './i18n'
import { unlockAudio, useSession, type Artifact, type Msg, type ProjectMeta } from './session'

type View =
  | { name: 'loading' }
  | { name: 'comenzar' }
  | { name: 'voz' }
  | { name: 'inicio' }
  | { name: 'proyectos' }
  | { name: 'conversacion'; project: string | null; key: number }

const energyLabel = (e: Energy) => t(`energy.${e}`)

export default function App() {
  const [view, setView] = useState<View>({ name: 'loading' })
  const [lang, setLang] = useLang()
  const [reactor, setReactor] = useState<ReactorProps>({ variant: 'despertar', energy: 'idle', offsetY: 60 })

  useEffect(() => {
    // Atajo de desarrollo: #view=inicio | voz | proyectos | conversacion
    const forced = new URLSearchParams(location.hash.slice(1)).get('view')
    if (forced) {
      const project = new URLSearchParams(location.hash.slice(1)).get('project')
      setView(forced === 'conversacion' ? { name: 'conversacion', project, key: Date.now() } : ({ name: forced } as View))
      return
    }
    fetch('/api/state')
      .then((r) => r.json())
      .then((s) => setView(s.voice?.configured ? { name: 'inicio' } : { name: 'comenzar' }))
      .catch(() => setView({ name: 'comenzar' }))
  }, [])

  useEffect(() => installCosmicInteractions(), [])

  const goHome = () => setView({ name: 'inicio' })

  return (
    <>
      <Scene {...reactor} />
      <CometCursor />
      <div className="layer">
        <div className="topleft">
          <button className="wordmark" onClick={goHome} title={t('home')}>PROMETEO</button>
          <LangSwitch lang={lang} setLang={setLang} />
        </div>
        {view.name === 'comenzar' && <Comenzar setReactor={setReactor} onStart={() => setView({ name: 'voz' })} />}
        {view.name === 'voz' && <DefinirVoz setReactor={setReactor} onDone={goHome} />}
        {view.name === 'inicio' && (
          <Inicio
            setReactor={setReactor}
            onStart={() => setView({ name: 'conversacion', project: null, key: Date.now() })}
            onOpen={() => setView({ name: 'proyectos' })}
          />
        )}
        {view.name === 'proyectos' && (
          <Proyectos setReactor={setReactor} onOpen={(slug) => setView({ name: 'conversacion', project: slug, key: Date.now() })} onBack={goHome} />
        )}
        {view.name === 'conversacion' && <Conversacion key={view.key} project={view.project} setReactor={setReactor} />}
      </div>
    </>
  )
}

type SetReactor = (p: ReactorProps) => void

/* ---------------- 01 · Primera vez ---------------- */
function Comenzar({ setReactor, onStart }: { setReactor: SetReactor; onStart: () => void }) {
  useEffect(() => { setReactor({ variant: 'despertar', energy: 'idle', offsetY: 60 }) }, [setReactor])
  return (
    <>
      <div className="status">{t('firstSetup')}</div>
      <div className="actions">
        <CosmicButton primary onClick={async () => { await unlockAudio(); onStart() }}>{t('begin')}</CosmicButton>
      </div>
    </>
  )
}

/* ---------------- 02 · Definir voz ---------------- */
function DefinirVoz({ setReactor, onDone }: { setReactor: SetReactor; onDone: () => void }) {
  const s = useSession({ mode: 'voz', enabled: true })
  const { enableMic } = s
  useEffect(() => { void enableMic() }, [enableMic])
  useEffect(() => { setReactor({ variant: 'escuchando', energy: s.energy, offsetY: 40 }) }, [s.energy, setReactor])
  useEffect(() => {
    if (s.voiceDone && !s.playing) {
      const t = setTimeout(onDone, 900)
      return () => clearTimeout(t)
    }
  }, [s.voiceDone, s.playing, onDone])

  return (
    <>
      <div className="status"><span className={`dot ${s.connected ? '' : 'off'}`} />{t('definingVoice')} · {energyLabel(s.energy)}</div>
      <Caption messages={s.messages} />
      <InputBar s={s} placeholder={t('voicePlaceholder')} />
      {(s.error || s.micError) && <div className="toast">{s.error || s.micError}</div>}
    </>
  )
}

/* ---------------- 03 · Inicio ---------------- */
function Inicio({ setReactor, onStart, onOpen }: { setReactor: SetReactor; onStart: () => void; onOpen: () => void }) {
  useEffect(() => { setReactor({ variant: 'reposo', energy: 'idle', offsetY: 80 }) }, [setReactor])
  return (
    <div className="actions">
      <CosmicButton primary onClick={async () => { await unlockAudio(); onStart() }}>START</CosmicButton>
      <CosmicButton onClick={onOpen}>OPEN PJ.</CosmicButton>
    </div>
  )
}

/* ---------------- 05 · Proyectos ---------------- */
function Proyectos({ setReactor, onOpen, onBack }: { setReactor: SetReactor; onOpen: (slug: string) => void; onBack: () => void }) {
  const [list, setList] = useState<ProjectMeta[] | null>(null)
  useEffect(() => { setReactor({ variant: 'reposo', energy: 'idle', offsetY: -230, scale: 0.9 }) }, [setReactor])
  useEffect(() => { fetch('/api/projects').then((r) => r.json()).then(setList).catch(() => setList([])) }, [])
  return (
    <div className="projects">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{t('projects')}</h2>
        <button className="btn secondary small" onClick={onBack}>{t('back')}</button>
      </div>
      <div className="list">
        {list === null && <p className="empty">{t('loading')}</p>}
        {list?.length === 0 && <p className="empty">{t('noProjects')}</p>}
        {list?.map((p) => (
          <button key={p.slug} className="card" onClick={async () => { await unlockAudio(); onOpen(p.slug) }}>
            <div className="title">{p.title}</div>
            <div className="meta">{t('updated', { date: new Date(p.updated).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' }) })}</div>
            {p.artifacts?.map((a) => <span key={a} className="chip">{a}</span>)}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------------- 04 · Conversación ---------------- */
function Conversacion({ project, setReactor }: { project: string | null; setReactor: SetReactor }) {
  const s = useSession({ mode: 'plan', project, enabled: true })
  const { enableMic } = s
  useEffect(() => { void enableMic() }, [enableMic])
  useEffect(() => { setReactor({ variant: 'escuchando', energy: s.energy, offsetY: 70, scale: 0.8 }) }, [s.energy, setReactor])

  return (
    <>
      <div className="status">
        <span className={`dot ${s.connected ? '' : 'off'}`} />
        {s.project?.title ?? t('connecting')} · {energyLabel(s.energy)}
      </div>
      <Transcript messages={s.messages} />
      <Artifacts artifacts={s.artifacts} />
      <Caption messages={s.messages} compact />
      <InputBar s={s} placeholder={t('chatPlaceholder')} />
      {(s.error || s.micError) && <div className="toast">{s.error || s.micError}</div>}
    </>
  )
}

/* ---------------- Piezas compartidas ---------------- */
function Caption({ messages, compact }: { messages: Msg[]; compact?: boolean }) {
  const lastAgent = [...messages].reverse().find((m) => m.role === 'agent')
  const lastIdx = lastAgent ? messages.lastIndexOf(lastAgent) : -1
  const userAfter = messages.slice(lastIdx + 1).find((m) => m.role === 'user')
  const text = lastAgent?.text ?? ''
  const shown = compact && text.length > 260 ? '…' + text.slice(-260) : text
  return (
    <div className="caption passthrough" style={compact ? { width: 'min(460px, calc(100vw - 32px))', fontSize: 17, top: 'calc(50% + 150px)' } : undefined}>
      {shown}
      {lastAgent?.tools.length ? <span className="you" style={{ marginTop: 8 }}>{lastAgent.tools[lastAgent.tools.length - 1]}</span> : null}
      {userAfter && <span className="you" data-you={t('you')}>{userAfter.text}</span>}
    </div>
  )
}

function InputBar({ s, placeholder }: { s: ReturnType<typeof useSession>; placeholder: string }) {
  const [text, setText] = useState('')
  return (
    <form className="inputbar" onSubmit={(e) => { e.preventDefault(); s.sendText(text); setText('') }}>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label={t('message')} />
      {s.playing && <button type="button" className="iconbtn" title={t('silence')} onClick={s.interrupt}>■</button>}
      <button
        type="button"
        className={`iconbtn ${s.micOn ? 'on' : ''}`}
        title={s.micOn ? t('micOff') : t('micOn')}
        onClick={() => (s.micOn ? s.disableMic() : s.enableMic())}
      >
        {s.micOn ? '🎙' : '🔇'}
      </button>
      <button type="submit" className="iconbtn" disabled={!text.trim() || !s.connected} title={t('send')}>➤</button>
    </form>
  )
}

function Transcript({ messages }: { messages: Msg[] }) {
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { void end.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  return (
    <aside className="panel left">
      <header>{t('transcript')}</header>
      <div className="body">
        {messages.length === 0 && <p className="empty">{t('transcriptEmpty')}</p>}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <span className="who">{m.role === 'user' ? t('you') : 'PROMETEO'}</span>
            {m.text}
            {m.tools.map((t, j) => <span key={j} className="tool">{t}</span>)}
          </div>
        ))}
        <div ref={end} />
      </div>
    </aside>
  )
}

function Artifacts({ artifacts }: { artifacts: Artifact[] }) {
  const [active, setActive] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const newest = useMemo(() => [...artifacts].sort((a, b) => b.mtime - a.mtime)[0]?.name ?? null, [artifacts])
  useEffect(() => { if (newest) setActive(newest) }, [newest])
  const cur = artifacts.find((a) => a.name === active) ?? artifacts[0]

  const copy = async () => {
    if (!cur) return
    await navigator.clipboard.writeText(cur.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  const download = () => {
    if (!cur) return
    const url = URL.createObjectURL(new Blob([cur.content], { type: 'text/markdown' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: cur.name })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <aside className="panel right">
      <header>
        {t('deliverables')}
        {cur && (
          <span style={{ display: 'flex', gap: 6 }}>
            <button className="btn secondary small" onClick={copy}>{copied ? t('copied') : t('copy')}</button>
            <button className="btn secondary small" onClick={download}>.MD</button>
          </span>
        )}
      </header>
      {artifacts.length > 0 && (
        <div className="tabs">
          {artifacts.map((a) => (
            <button key={a.name} className={`tab ${a.name === cur?.name ? 'active' : ''}`} onClick={() => setActive(a.name)}>{a.name}</button>
          ))}
        </div>
      )}
      <div className="body">
        {cur ? (
          <div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{cur.content}</ReactMarkdown></div>
        ) : (
          <p className="empty">{t('deliverablesEmpty')}</p>
        )}
      </div>
    </aside>
  )
}

function LangSwitch({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="lang-switch" role="group" aria-label={t('langLabel')} title={t('langHint')}>
      {(['es', 'en'] as const).map((l, i) => (
        <span key={l}>
          {i > 0 && <span className="sep" aria-hidden="true">|</span>}
          <button className={lang === l ? 'active' : ''} aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
        </span>
      ))}
      {lang === 'en' && <span className="hint">{t('langHint')}</span>}
    </div>
  )
}
