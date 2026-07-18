# frontend/Dockerfile — React 19 + TypeScript (Vite) SPA.
#
# Multi-stage build: Node build stage -> Nginx static-serving runtime stage.

# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
# --- TODO(phase 2): add SPA-friendly nginx.conf (history fallback) + security headers ---
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1
