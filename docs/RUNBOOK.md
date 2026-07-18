# Runbook

Everything runs on Docker Desktop (Windows). The security tools run as containers — no local
Java/Node install is required for them.

## 0. Prerequisites

1. Install **Docker Desktop** and launch it (wait for "Engine running"; WSL 2 backend enabled).
2. Verify:
   ```bash
   docker version
   docker compose version
   ```

## 1. Install the Git hooks (once per clone)

```bash
git config core.hooksPath .githooks
```

- `pre-commit`: Gitleaks (secret scan) + ESLint (frontend).
- `pre-push`: Semgrep (SAST) + Trivy (dependency scan).
- Hooks are report-only (they print findings but do not block). Bypass entirely with
  `SKIP_HOOKS=1 git commit ...`.

## 2. Run the application stack

```bash
docker compose up --build
```

| Service | URL / Port |
|---|---|
| backend (Spring Boot) | http://localhost:8080 |
| frontend (React/Nginx) | http://localhost:5173 |
| postgres | localhost:5434 (db `bookacourt`, user `postgres`) — add to pgAdmin with these |
| mailpit | http://localhost:8025 |

Stop: `Ctrl+C` then `docker compose down` (add `-v` to wipe the DB volume).

> The container's Postgres is published on host port **5434** (container 5433), so it does not
> clash with a local Postgres on 5433. Add it to pgAdmin as: host `localhost`, port `5434`,
> database `bookacourt`, user `postgres`, password `bookacourt_dev_pw`.

Smoke-test the two public vulnerable endpoints:

```bash
curl "http://localhost:8080/api/courts/search?name=test"     # SQL injection target
curl "http://localhost:8080/api/utils/ping?host=localhost"   # command injection target
```

## 3. Run the security tools manually

Static tools run from the repo root. Dynamic tools need the stack running (Section 2).
Output goes to `reports/`.

```bash
# Secret scan  (Git Bash on Windows: prefix with MSYS_NO_PATHCONV=1)
docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest \
  dir /repo --config=/repo/.gitleaks.toml \
  --report-format json --report-path /repo/reports/gitleaks.json

# SAST (Java + TypeScript)
docker run --rm -v "$PWD:/src" semgrep/semgrep:latest \
  semgrep scan --config=auto --json --output=/src/reports/semgrep.json /src

# Dependency CVEs (Maven + npm)
docker run --rm -v "$PWD:/src" aquasec/trivy:latest \
  fs --scanners vuln --severity HIGH,CRITICAL --format json \
  --output /src/reports/trivy-fs.json /src

# Dockerfile lint
docker run --rm -i hadolint/hadolint hadolint --format json - < backend/Dockerfile

# Image CVEs (after `docker compose build`)
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest \
  image bookacourt-backend

# Dynamic scans (stack running)
bash security/scripts/run-nmap.sh
bash security/scripts/run-zap.sh
bash security/scripts/run-sqlmap.sh

# Consolidate results into reports/summary.md
bash security/scripts/gen-report.sh
```

## 4. Run the pipeline in Jenkins

Jenkins runs in Docker with the host Docker socket mounted so it can launch the tool
containers. The Jenkins home is bind-mounted to a host folder so the tools' volume mounts
resolve correctly.

### 4.1 Start Jenkins

```bash
docker run -d --name jenkins \
  -p 8081:8080 -p 50000:50000 \
  -v /c/Users/giorg/jenkins:/var/jenkins_home \
  -v //var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts
```

- UI: http://localhost:8081 (8081 avoids clashing with the app on 8080).
- Initial admin password:
  ```bash
  docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
  ```
- Install suggested plugins, create the admin user.

### 4.2 Give Jenkins the Docker CLI

```bash
docker exec -u root jenkins bash -c "apt-get update && apt-get install -y docker.io"
docker restart jenkins
```

### 4.3 Create the pipeline job

1. New Item → name `bookacourt` → Pipeline.
2. Pipeline → Definition: **Pipeline script from SCM** → Git → your repo URL → branch `*/master`.
3. Script Path: `Jenkinsfile` → Save → **Build Now**.

The pipeline checks out the code, runs the static scans, builds the images, scans the image,
starts the stack, runs the dynamic scans, and archives everything under `reports/`.

## 5. Results

- `reports/` — raw tool output (regenerated each run; gitignored).
- `reports/summary.md` — consolidated per-tool findings table.
