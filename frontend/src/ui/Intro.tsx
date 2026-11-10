import { useEffect, useState } from 'react'
import { playIntroSound } from '../audio/introSound'
import { t } from '../i18n'
import { finishIntro, prefersReducedMotion, skipIntro, SKIP_MS, startIntro, T } from '../intro'
import { audioPlayer, unlockAudio } from '../session'

/*
 * Animación de inicio. La orquestación vive fuera de React y se lanza una sola vez por carga
 * de página (StrictMode monta los efectos dos veces en desarrollo).
 */
let launched = false

function launch(onGate: (show: boolean) => void, onReveal: () => void) {
  if (launched) return
  launched = true
  // Solo al entrar por la portada: en otras vistas (conversación, definir voz) el micro arrancaría bajo la intro.
  const landing = location.hash.replace(/^#\/?/, '')
  const onHome = landing === '' || landing === 'inicio' || landing === 'comenzar'
  if (prefersReducedMotion() || !onHome) { finishIntro(); onReveal(); return }

  let sound: ReturnType<typeof playIntroSound> | null = null
  const timers: number[] = []
  let revealed = false
  const reveal = () => { if (!revealed) { revealed = true; onReveal() } }

  const finish = () => {
    timers.forEach(clearTimeout)
    removeEventListener('pointerdown', skip)
    removeEventListener('keydown', skip)
    finishIntro()
    reveal()
  }
  // Clic o tecla durante la intro: fundido rápido al estado final y el sonido baja en 0,3 s.
  const skip = () => {
    removeEventListener('pointerdown', skip)
    removeEventListener('keydown', skip)
    timers.forEach(clearTimeout)
    skipIntro()
    sound?.stop(0.3)
    reveal()
    timers.push(window.setTimeout(finish, SKIP_MS))
  }

  const begin = (ctx: AudioContext) => {
    startIntro()
    // Con el audio aún bloqueado la intro va en silencio: si se programase, sonaría entera más tarde.
    if (ctx.state === 'running') sound = playIntroSound(ctx)
    timers.push(window.setTimeout(reveal, T.ui * 1000), window.setTimeout(finish, T.end * 1000))
    // Un poco de margen para que el gesto que ha desbloqueado el sonido no cuente como «saltar».
    timers.push(window.setTimeout(() => {
      addEventListener('pointerdown', skip)
      addEventListener('keydown', skip)
    }, 400))
  }

  // Sin un gesto previo el navegador suele dejar el audio suspendido (y resume() queda pendiente
  // sin fallar), así que se mira el estado en vez de esperar a la promesa.
  const player = audioPlayer()
  void player.unlock().catch(() => {})
  window.setTimeout(() => {
    if (player.ctx.state === 'running') { begin(player.ctx); return }
    onGate(true)
    // click (no pointerdown): un toque en pantalla táctil solo desbloquea el audio en el click.
    // Si el gesto no lo desbloquea (p. ej. Esc), resume() queda pendiente: la intro arranca igual, sin sonido.
    const awaken = async () => {
      removeEventListener('click', awaken)
      removeEventListener('keydown', awaken)
      onGate(false)
      await Promise.race([unlockAudio().catch(() => {}), new Promise((r) => setTimeout(r, 300))])
      begin(player.ctx)
    }
    addEventListener('click', awaken)
    addEventListener('keydown', awaken)
  }, 150)
}

export default function Intro({ onReveal }: { onReveal: () => void }) {
  const [gate, setGate] = useState(false)
  useEffect(() => launch(setGate, onReveal), [onReveal])
  if (!gate) return null
  return (
    <div className="intro-gate" role="button" aria-label={t('intro.gate')}>
      <span>{t('intro.gate')}</span>
    </div>
  )
}
