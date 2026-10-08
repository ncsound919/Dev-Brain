# Dev-Brain — cloud deploy (Railway).
# Builds with the project's own toolchain (vite + esbuild), then runs the
# bundled server. Vite is only used when NODE_ENV !== production, so production
# serves the built client statically.
FROM oven/bun:1-debian

WORKDIR /app

# Install with the lockfile first (better layer caching).
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

ENV NODE_ENV=production
# Railway injects PORT; bind all interfaces so its ingress can reach us.
ENV HOST=0.0.0.0

EXPOSE 8080
CMD ["bun", "dist/server.cjs"]
