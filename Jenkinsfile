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
        PROJECT = 'bookacourt'
        NETWORK = 'bookacourt_default'
        BACKEND = 'http://backend:8080'
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
                sh '''docker run --rm -v "${WORKSPACE}:/repo" zricethezav/gitleaks:latest \
                        dir /repo --config=/repo/.gitleaks.toml \
                        --report-format json --report-path /repo/reports/gitleaks.json || true'''
            }
        }

        stage('SAST') {
            steps {
                sh '''docker run --rm -v "${WORKSPACE}:/src" semgrep/semgrep:latest \
                        semgrep scan --config=auto --json --output=/src/reports/semgrep.json /src || true'''
            }
        }

        stage('Dependency scan') {
            steps {
                sh '''docker run --rm -v "${WORKSPACE}:/src" aquasec/trivy:latest \
                        fs --scanners vuln --severity HIGH,CRITICAL \
                        --format json --output /src/reports/trivy-fs.json /src || true'''
            }
        }

        stage('Dockerfile lint') {
            steps {
                sh 'docker run --rm -i hadolint/hadolint hadolint --format json - < backend/Dockerfile > reports/hadolint.json || true'
            }
        }

        stage('Build') {
            steps {
                sh 'docker compose -p ${PROJECT} build'
            }
        }

        stage('Image scan') {
            steps {
                sh '''docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        -v "${WORKSPACE}/reports:/reports" \
                        aquasec/trivy:latest image \
                        --format json --output /reports/trivy-image.json \
                        bookacourt-backend || true'''
            }
        }

        stage('Deploy stack') {
            steps {
                sh 'docker compose -p ${PROJECT} up -d'
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
                sh '''docker run --rm --network ${NETWORK} -v "${WORKSPACE}/reports:/zap/wrk:rw" \
                        ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
                        -t ${BACKEND} -r zap-baseline.html -J zap-baseline.json || true'''
                sh '''docker run --rm --network ${NETWORK} -v "${WORKSPACE}/reports/sqlmap:/out" \
                        ghcr.io/sqlmapproject/sqlmap:latest \
                        -u "${BACKEND}/api/courts/search?name=test" \
                        --batch --dbms=postgresql --level=2 --risk=2 --output-dir=/out || true'''
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
            sh 'docker compose -p ${PROJECT} down -v || true'
            archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true
        }
    }
}
