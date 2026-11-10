import { T } from '../intro'

/**
 * Sonido de la animación de inicio, sintetizado con Web Audio (sin ficheros):
 *  1. Oscuridad: un zumbido subgrave crece y un soplo de ruido sube de tono.
 *  2. Ignición: impacto grave que cae de tono + ráfaga de ruido con reverberación.
 *  3. Primeros latidos del corazón (doble golpe, a compás con el reactor).
 *  4. Estrellas: acorde abierto en quintas que brilla y destellos agudos sueltos.
 * Va directo al destino (no al analizador de la voz) para no mover el reactor.
 */
export function playIntroSound(ctx: AudioContext) {
  const t0 = ctx.currentTime + 0.05
  const at = (s: number) => t0 + s
  const ig = at(T.ignite)

  const master = ctx.createGain()
  master.gain.value = 0.42 // volumen general (pico ≈ 0,7 sin saturar)
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -14
  comp.ratio.value = 4
  master.connect(comp).connect(ctx.destination)

  const reverb = ctx.createConvolver()
  reverb.buffer = impulse(ctx, 3.6, 2.6)
  const wet = ctx.createGain()
  wet.gain.value = 0.9
  reverb.connect(wet).connect(master)

  const nodes: AudioScheduledSourceNode[] = []
  const noise = noiseBuffer(ctx, 2)

  const env = (g: GainNode, points: [number, number][]) => {
    g.gain.setValueAtTime(0, t0)
    for (const [time, v] of points) g.gain.linearRampToValueAtTime(v, time)
  }
  const osc = (type: OscillatorType, freq: number, dest: AudioNode, start: number, stop: number) => {
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.setValueAtTime(freq, start)
    o.connect(dest)
    o.start(start)
    o.stop(stop)
    nodes.push(o)
    return o
  }
  const noiseSrc = (dest: AudioNode, start: number, stop: number) => {
    const n = ctx.createBufferSource()
    n.buffer = noise
    n.loop = true
    n.connect(dest)
    n.start(start)
    n.stop(stop)
    nodes.push(n)
    return n
  }

  // 1 · Zumbido subgrave (Mi grave, con dos osciladores ligeramente desafinados que laten)
  const droneLp = ctx.createBiquadFilter()
  droneLp.type = 'lowpass'
  droneLp.frequency.setValueAtTime(90, t0)
  droneLp.frequency.exponentialRampToValueAtTime(420, ig)
  droneLp.frequency.exponentialRampToValueAtTime(120, at(T.end))
  const drone = ctx.createGain()
  env(drone, [[at(0.2), 0.05], [ig - 0.05, 0.34], [ig + 0.4, 0.24], [at(T.end + 0.6), 0]])
  droneLp.connect(drone).connect(master)
  osc('sawtooth', 41.2, droneLp, t0, at(T.end + 0.7))
  osc('sawtooth', 41.6, droneLp, t0, at(T.end + 0.7))
  osc('sine', 82.4, droneLp, t0, at(T.end + 0.7))

  // 1 · Soplo que sube (ruido filtrado en barrido ascendente) y se corta justo en la ignición
  const riserBp = ctx.createBiquadFilter()
  riserBp.type = 'bandpass'
  riserBp.Q.value = 1.6
  riserBp.frequency.setValueAtTime(180, at(0.4))
  riserBp.frequency.exponentialRampToValueAtTime(4200, ig)
  const riser = ctx.createGain()
  env(riser, [[at(0.4), 0], [ig - 0.08, 0.2], [ig, 0]])
  riserBp.connect(riser)
  riser.connect(master)
  riser.connect(reverb)
  noiseSrc(riserBp, at(0.4), ig + 0.05)

  // 2 · Impacto: seno que cae de 130 Hz a 34 Hz
  const boom = ctx.createGain()
  boom.gain.setValueAtTime(0, ig)
  boom.gain.linearRampToValueAtTime(1, ig + 0.01)
  boom.gain.exponentialRampToValueAtTime(0.001, ig + 2.2)
  boom.connect(master)
  osc('sine', 130, boom, ig, ig + 2.3).frequency.exponentialRampToValueAtTime(34, ig + 1.1)

  // 2 · Ráfaga de ruido que se oscurece, casi toda hacia la reverberación
  const burstLp = ctx.createBiquadFilter()
  burstLp.type = 'lowpass'
  burstLp.frequency.setValueAtTime(5000, ig)
  burstLp.frequency.exponentialRampToValueAtTime(160, ig + 1.4)
  const burst = ctx.createGain()
  burst.gain.setValueAtTime(0, ig)
  burst.gain.linearRampToValueAtTime(0.5, ig + 0.01)
  burst.gain.exponentialRampToValueAtTime(0.001, ig + 1.6)
  burstLp.connect(burst)
  burst.connect(master)
  burst.connect(reverb)
  noiseSrc(burstLp, ig, ig + 1.7)

  // 3 · Latidos: doble golpe cada 1,2 s (el segundo a 0,22 s), como el reactor
  const thump = (time: number, level: number) => {
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, time)
    g.gain.linearRampToValueAtTime(level, time + 0.012)
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.45)
    g.connect(master)
    osc('sine', 72, g, time, time + 0.5).frequency.exponentialRampToValueAtTime(38, time + 0.3)
  }
  thump(ig + 0.22, 0.35) // el impacto es el primer golpe; este es su eco doble
  for (const [i, level] of [0.5, 0.32, 0.18].entries()) {
    thump(ig + 1.2 * (i + 1), level)
    thump(ig + 1.2 * (i + 1) + 0.22, level * 0.6)
  }

  // 4 · Acorde abierto en quintas (Mi · Si · Mi · Si · Mi) que florece con las estrellas
  const pad = ctx.createGain()
  const st = at(T.stars)
  env(pad, [[st - 0.2, 0], [st + 1.6, 0.11], [at(T.end - 0.4), 0.09], [at(T.end + 3), 0]])
  const padLp = ctx.createBiquadFilter()
  padLp.type = 'lowpass'
  padLp.frequency.setValueAtTime(700, st)
  padLp.frequency.exponentialRampToValueAtTime(5200, st + 2.4)
  padLp.connect(pad)
  pad.connect(master)
  pad.connect(reverb)
  for (const [i, f] of [164.8, 246.9, 329.6, 493.9, 659.3].entries()) {
    osc('triangle', f, padLp, st - 0.2, at(T.end + 3.1)).detune.value = (i % 2 ? 1 : -1) * 5
    osc('sine', f * 2.003, padLp, st - 0.2, at(T.end + 3.1))
  }

  // 4 · Destellos: notas agudas sueltas de la pentatónica de Mi, como estrellas que se encienden
  const sparkle = [987.8, 1108.7, 1318.5, 1480, 1661.2, 1975.5, 2217.5, 2637]
  for (let i = 0; i < 14; i++) {
    const time = st + 0.15 + i * 0.2 + Math.random() * 0.15
    const g = ctx.createGain()
    const level = 0.05 + Math.random() * 0.04
    g.gain.setValueAtTime(0, time)
    g.gain.linearRampToValueAtTime(level, time + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0005, time + 0.9)
    g.connect(reverb)
    g.connect(master)
    osc('sine', sparkle[Math.floor(Math.random() * sparkle.length)], g, time, time + 1)
  }

  return {
    /** Baja el volumen en `fade` s y corta todo (para saltar la intro). */
    stop(fade = 0.3) {
      const n = ctx.currentTime
      master.gain.cancelScheduledValues(n)
      master.gain.setValueAtTime(master.gain.value, n)
      master.gain.linearRampToValueAtTime(0, n + fade)
      for (const s of nodes) {
        try { s.stop(n + fade + 0.05) } catch { /* ya parado */ }
      }
    },
  }
}

function noiseBuffer(ctx: AudioContext, seconds: number) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

/** Respuesta al impulso estéreo generada: ruido con caída exponencial (sala enorme). */
function impulse(ctx: AudioContext, seconds: number, decay: number) {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay
  }
  return buf
}
