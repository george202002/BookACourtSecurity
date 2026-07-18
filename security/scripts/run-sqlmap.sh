#!/usr/bin/env bash
# Confirm SQL injection on the court search endpoint. Writes results under reports/sqlmap/.
# Usage: ./run-sqlmap.sh [url]
set -euo pipefail
export MSYS_NO_PATHCONV=1  # Git Bash (Windows): keep container paths literal

URL="${1:-http://host.docker.internal:8080/api/courts/search?name=test}"
OUT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)/reports/sqlmap"
mkdir -p "${OUT_DIR}"

docker run --rm -v "${OUT_DIR}:/out" \
  ghcr.io/sqlmapproject/sqlmap:latest \
  -u "${URL}" --batch --dbms=postgresql --level=2 --risk=2 --output-dir=/out
