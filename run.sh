#!/usr/bin/env bash
# Arranca ORION en modo desarrollo: backend (8765) + frontend (5173).
# Abre http://localhost:5173
set -euo pipefail
cd "$(dirname "$0")"
unset ANTHROPIC_API_KEY   # usa tu suscripción de Claude (claude login), nunca una API key

if [ ! -f backend/models/kokoro-v1.0.onnx ]; then
  echo "Descargando modelo de voz Kokoro (~350 MB)…"
  mkdir -p backend/models
  curl -fL -o backend/models/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
  curl -fL -o backend/models/voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
fi
[ -d frontend/node_modules ] || (cd frontend && npm install)

(cd backend && uv run uvicorn app.main:app --port 8765 --log-level warning) &
BACK=$!
trap 'kill $BACK 2>/dev/null' EXIT
cd frontend && npm run dev -- --port 5173 --strictPort
