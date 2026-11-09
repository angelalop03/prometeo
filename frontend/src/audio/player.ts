import { levels } from './levels'

/** Reproduce en cola los WAV que envía el backend y expone el nivel de salida. */
export class VoicePlayer {
  ctx: AudioContext
  private analyser: AnalyserNode
  private gain: GainNode
  private nextTime = 0
  private sources = new Set<AudioBufferSourceNode>()
  private chain: Promise<void> = Promise.resolve()
  private generation = 0
  private raf = 0
  onPlayingChange: (playing: boolean) => void = () => {}

  constructor() {
    this.ctx = new AudioContext()
    this.gain = this.ctx.createGain()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 512
    this.gain.connect(this.analyser).connect(this.ctx.destination)
    this.tick()
  }

  async unlock() {
    if (this.ctx.state !== 'running') await this.ctx.resume()
  }

  get playing() {
    return this.sources.size > 0
  }

  /** Encola un WAV. Se decodifica en orden aunque lleguen rápido. */
  enqueue(wav: ArrayBuffer) {
    const gen = this.generation
    this.chain = this.chain.then(async () => {
      const buf = await this.ctx.decodeAudioData(wav).catch(() => null)
      if (!buf || gen !== this.generation) return
      const src = this.ctx.createBufferSource()
      src.buffer = buf
      src.connect(this.gain)
      const start = Math.max(this.ctx.currentTime + 0.03, this.nextTime)
      src.start(start)
      this.nextTime = start + buf.duration
      this.sources.add(src)
      if (this.sources.size === 1) this.onPlayingChange(true)
      src.onended = () => {
        this.sources.delete(src)
        if (this.sources.size === 0) this.onPlayingChange(false)
      }
    })
  }

  /** Corta todo lo que suena y descarta lo pendiente (barge-in). */
  stop() {
    this.generation++
    for (const s of this.sources) {
      s.onended = null
      try { s.stop() } catch { /* ya parado */ }
    }
    const was = this.sources.size > 0
    this.sources.clear()
    this.nextTime = 0
    if (was) this.onPlayingChange(false)
  }

  private tick = () => {
    const data = new Uint8Array(this.analyser.fftSize)
    const loop = () => {
      this.analyser.getByteTimeDomainData(data)
      let sum = 0
      for (const v of data) sum += ((v - 128) / 128) ** 2
      levels.out = Math.min(1, Math.sqrt(sum / data.length) * 4)
      this.raf = requestAnimationFrame(loop)
    }
    loop()
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    this.stop()
    void this.ctx.close()
  }
}
