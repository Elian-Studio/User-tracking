# ── Stage 1: base ──────────────────────────────────────────────
FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@10.30.0 --activate
WORKDIR /app

# ── Stage 2: deps ─────────────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/server/package.json packages/server/package.json
RUN pnpm install --frozen-lockfile

# ── Stage 3: build ────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN pnpm turbo build --filter=@flowmvp/server...
RUN pnpm deploy --filter=@flowmvp/server --prod --legacy /app/deploy

# ── Stage 4: production ──────────────────────────────────────
FROM node:20-slim AS production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 server
WORKDIR /app
COPY --from=build /app/deploy .
USER server
EXPOSE 3100
CMD ["node", "dist/index.js"]
