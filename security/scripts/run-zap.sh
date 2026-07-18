#!/usr/bin/env bash
# OWASP ZAP baseline DAST scan of the running backend.
# Writes reports/zap-baseline.{html,json}.
# Usage: ./run-zap.sh [base_url]
set -euo pipefail
export MSYS_NO_PATHCONV=1  # Git Bash (Windows): keep container paths literal

TARGET="${1:-http://host.docker.internal:8080}"
OUT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)/reports"
mkdir -p "${OUT_DIR}"

docker run --rm -v "${OUT_DIR}:/zap/wrk:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t "${TARGET}" \
  -r zap-baseline.html -J zap-baseline.json || true
