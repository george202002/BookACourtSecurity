#!/usr/bin/env bash
# Port scan of the running application. Writes reports/nmap.txt.
# Usage: ./run-nmap.sh [target]
set -euo pipefail
export MSYS_NO_PATHCONV=1  # Git Bash (Windows): keep container paths literal

TARGET="${1:-host.docker.internal}"
OUT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)/reports"
mkdir -p "${OUT_DIR}"

docker run --rm instrumentisto/nmap:latest \
  -sV -Pn -p 8080,5173,5434,1025,8025 "${TARGET}" \
  | tee "${OUT_DIR}/nmap.txt"
