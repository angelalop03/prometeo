// Copia el modelo Silero VAD, su worklet y los binarios WASM de onnxruntime a public/vad/
// para que la detección de voz funcione 100 % offline.
import { cpSync, mkdirSync, readdirSync } from 'node:fs'

const out = 'public/vad'
mkdirSync(out, { recursive: true })
const vad = 'node_modules/@ricky0123/vad-web/dist'
for (const f of ['vad.worklet.bundle.min.js', 'silero_vad_v5.onnx', 'silero_vad_legacy.onnx']) cpSync(`${vad}/${f}`, `${out}/${f}`)
const ort = 'node_modules/onnxruntime-web/dist'
for (const f of readdirSync(ort)) if (/^ort-wasm.*\.(wasm|mjs)$/.test(f)) cpSync(`${ort}/${f}`, `${out}/${f}`)
console.log('VAD assets →', out)
