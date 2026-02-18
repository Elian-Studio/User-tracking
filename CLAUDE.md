# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm build              # Build all packages (Turbo, respects dependency order)
pnpm dev:server         # Run Fastify server with tsx watch (hot reload)
pnpm build:shared       # Build only @flowmvp/shared
pnpm build:sdk          # Build only @flowmvp/sdk
pnpm build:server       # Build only @flowmvp/server
pnpm typecheck          # Type check all packages via Turbo
pnpm clean              # Remove dist/ and tsbuildinfo from all packages
```

Build order enforced by Turbo: `shared` → `sdk` + `server` (parallel).

## Architecture

Turborepo + pnpm monorepo with 3 packages — a lightweight analytics system that replaces Google Analytics for multiple React projects.

**@flowmvp/shared** — Foundation types and constants consumed by both SDK and server. Defines `AnalyticsEvent`, `Session`, `Service` types plus constants for session timeout (30min), scroll milestones, API paths.

**@flowmvp/sdk** — Browser-side client library. `Flow.init()` sets up session management (localStorage, 30min timeout), and auto-starts pageview/scroll/exit trackers. Uses `fetch` with `keepalive` for events and `navigator.sendBeacon` for exit/session-end (survives page unload). Peer dependency on React 18/19.

**@flowmvp/server** — Fastify v5 API server. Receives events from SDK, stores in PostgreSQL via `postgres` (postgresjs). Auto-creates services on first event (`getOrCreateService`). Serves metrics APIs (UV, PV, bounce rate, per-page stats). Runs on port 3100 by default.

**Data flow**: SDK → HTTP/beacon → Server routes → Service layer → PostgreSQL

## Key Conventions

- **ES module imports require `.js` extensions** in all TypeScript files (`import { foo } from "./bar.js"`). This is required by `moduleResolution: "bundler"` with ESM output.
- All packages use `"type": "module"` and output to `dist/`.
- Cross-package imports use `@flowmvp/shared` (workspace protocol in package.json).
- SDK wraps all localStorage and network calls in try-catch — analytics failures must never crash the host app.
- Server uses tagged template SQL queries via `postgres` library (not an ORM).

## Environment Variables (server)

```
DATABASE_URL=postgres://user:password@localhost:5432/flowmvp
PORT=3100
CORS_ORIGIN=http://localhost:3000
```

Copy `packages/server/.env.example` to `packages/server/.env`.

## Database

PostgreSQL with 3 tables: `services`, `sessions` (UUID PK), `events` (BIGSERIAL PK with CHECK constraint on type). Migration SQL at `packages/server/src/db/migrations/001_init.sql`. Multi-tenant by `service_key` — each React project registers with a unique key.
