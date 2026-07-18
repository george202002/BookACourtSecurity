#!/usr/bin/env bash
# Consolidate the individual tool outputs in reports/ into reports/summary.md.
# Run after the other tools. Usage: ./gen-report.sh
set -euo pipefail

OUT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)/reports"
SUMMARY="${OUT_DIR}/summary.md"
mkdir -p "${OUT_DIR}"

# count <file> <pattern> -> number of matches, or "-" if the file is missing
count() {
  if [[ -f "$1" ]]; then grep -o "$2" "$1" 2>/dev/null | wc -l | tr -d ' '; else echo "-"; fi
}

{
  echo "# Scan Summary"
  echo ""
  echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo ""
  echo "| Tool | Category | Findings | Report file |"
  echo "|---|---|---|---|"
  echo "| Gitleaks | Secrets | $(count "${OUT_DIR}/gitleaks.json" '"RuleID"') | gitleaks.json |"
  echo "| Semgrep | SAST | $(count "${OUT_DIR}/semgrep.json" '"check_id"') | semgrep.json |"
  echo "| Trivy (fs) | Dependency CVEs | $(count "${OUT_DIR}/trivy-fs.json" '"VulnerabilityID"') | trivy-fs.json |"
  echo "| Hadolint | Dockerfile | $(count "${OUT_DIR}/hadolint.json" '"code"') | hadolint.json |"
  echo "| Trivy (image) | Image CVEs | $(count "${OUT_DIR}/trivy-image.json" '"VulnerabilityID"') | trivy-image.json |"
  echo "| OWASP ZAP | DAST | $(count "${OUT_DIR}/zap-baseline.json" '"alertRef"') | zap-baseline.html |"
  echo "| sqlmap | SQL injection | see report | sqlmap/ |"
  echo "| Nmap | Port scan | $(count "${OUT_DIR}/nmap.txt" '/tcp *open') | nmap.txt |"
} > "${SUMMARY}"

echo "Wrote ${SUMMARY}"
