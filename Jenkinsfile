// BookACourt DevSecOps CI/CD pipeline.
// Requires a Jenkins agent with the Docker CLI and access to the Docker daemon.
// Security tools run as ephemeral Docker containers and write output to reports/.

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    environment {
        COMPOSE_PROJECT_NAME = 'bookacourt'   // sets the project name without the -p flag
        DOCKER_BUILDKIT = '0'
        NETWORK = 'bookacourt_default'
        BACKEND = 'http://backend:8080'
        FRONTEND = 'http://frontend'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                sh 'mkdir -p reports'
            }
        }

        stage('Secret scan') {
            steps {
                sh '''docker run --rm --volumes-from jenkins zricethezav/gitleaks:latest \
                        dir "${WORKSPACE}" --config="${WORKSPACE}/.gitleaks.toml" \
                        --report-format json --report-path "${WORKSPACE}/reports/gitleaks.json" || true'''
            }
        }

        stage('SAST') {
            steps {
                sh '''docker run --rm --volumes-from jenkins semgrep/semgrep:latest \
                        semgrep scan --config=auto --json --output="${WORKSPACE}/reports/semgrep.json" \
                        --exclude=node_modules --exclude=target --exclude=dist "${WORKSPACE}" || true'''
            }
        }

        stage('Dependency scan') {
            steps {
                // npm deps from the lockfile (fast, offline). Java/Maven deps are scanned from the
                // bundled jar in the Image scan stage, avoiding slow/rate-limited pom.xml resolution.
                sh '''docker run --rm --volumes-from jenkins aquasec/trivy:latest \
                        fs --scanners vuln --severity HIGH,CRITICAL \
                        --format json --output "${WORKSPACE}/reports/trivy-fs.json" \
                        "${WORKSPACE}/frontend/package-lock.json" || true'''
            }
        }

        stage('Dockerfile lint') {
            steps {
                sh 'docker run --rm -i hadolint/hadolint hadolint --format json - < backend/Dockerfile > reports/hadolint.json || true'
            }
        }

        stage('Build') {
            steps {
                sh 'docker build -t bookacourt-backend ./backend'
                sh 'docker build -t bookacourt-frontend ./frontend'
            }
        }

        stage('Image scan') {
            steps {
                sh '''docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        --volumes-from jenkins \
                        aquasec/trivy:latest image \
                        --format json --output "${WORKSPACE}/reports/trivy-image.json" \
                        bookacourt-backend || true'''
            }
        }

        stage('Deploy stack') {
            steps {
                sh 'docker compose up -d --no-build'
                sh '''for i in $(seq 1 30); do
                        docker run --rm --network ${NETWORK} curlimages/curl:latest \
                          -sf ${BACKEND}/api/courts/search?name=a && break
                        echo "waiting for backend ($i)"; sleep 5
                      done'''
            }
        }

        stage('Dynamic analysis') {
            steps {
                sh '''docker run --rm --network ${NETWORK} instrumentisto/nmap:latest \
                        -sV -Pn -p 8080 backend > reports/nmap.txt || true'''
                // ZAP scans the frontend (HTML -> full header rule coverage); the backend root is
                // auth-gated (403) so it yields no passive findings.
                sh '''docker run --rm --network ${NETWORK} --volumes-from jenkins \
                        ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
                        -t ${FRONTEND} \
                        -r "${WORKSPACE}/reports/zap-baseline.html" \
                        -J "${WORKSPACE}/reports/zap-baseline.json" || true'''
                sh '''docker run --rm --network ${NETWORK} --volumes-from jenkins \
                        googlesky/sqlmap:latest \
                        -u "${BACKEND}/api/courts/search?name=Padel" \
                        --batch --dbms=postgresql --level=2 --risk=2 \
                        --output-dir="${WORKSPACE}/reports/sqlmap" || true'''
            }
        }

        stage('Report') {
            steps {
                sh 'bash security/scripts/gen-report.sh || true'
            }
        }
    }

    post {
        always {
            sh 'docker compose down -v || true'
            archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true
        }
    }
}
