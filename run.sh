#!/usr/bin/env bash
# Atajo de compatibilidad: igual que `prometeo run` (ver bin/prometeo --help).
exec "$(dirname "$0")/bin/prometeo" run "$@"
