import react from '@vitejs/plugin-react'
import { createReadStream, existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const BACKEND = process.env.PROMETEO_BACKEND ?? 'http://127.0.0.1:8765'

/**
 * onnxruntime-web importa dinámicamente sus .mjs desde /vad/. En desarrollo Vite
 * bloquea los imports de /public, así que servimos esa carpeta tal cual, antes que Vite.
 */
function serveVadAssets(): Plugin {
  const types: Record<string, string> = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.wasm': 'application/wasm', '.onnx': 'application/octet-stream' }
  const root = join(import.meta.dirname, 'public', 'vad')
  return {
    name: 'serve-vad-assets',
    configureServer(server) {
      server.middlewares.use('/vad', (req, res, next) => {
        const file = normalize(join(root, (req.url ?? '').split('?')[0]))
        if (!file.startsWith(root) || !existsSync(file)) return next()
        res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream')
        createReadStream(file).pipe(res)
      })
    },
  }
}

export default defineConfig({
  plugins: [serveVadAssets(), react()],
  server: {
    port: 5173,
    proxy: {
      '/api': BACKEND,
      '/ws': { target: BACKEND, ws: true },
    },
  },
})
