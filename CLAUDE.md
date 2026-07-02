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

## Testing

Vitest across all packages (`pnpm test`, or `pnpm --filter <pkg> test`). `dashboard` also uses `@testing-library/react`. See `TESTING.md` for framework details and conventions.

- 100% test coverage is the goal — tests make vibe coding safe.
- When writing a new function, write a corresponding test.
- When fixing a bug, write a regression test.
- When adding error handling, write a test that triggers the error.
- When adding a conditional (if/else, switch), write tests for BOTH paths.
- Never commit code that makes existing tests fail.

## Communication

- **모든 응답은 한국어로 작성합니다.** 코드, 커밋 메시지, 변수명 등 코드 자체는 영어를 유지하되, 사용자와의 대화 및 설명은 한국어로 합니다.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
