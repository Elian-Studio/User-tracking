# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence — without them, vibe coding is just yolo coding. With tests, it's a superpower.

## Framework

[Vitest](https://vitest.dev) 4.x across all four packages (`shared`, `sdk`, `server`, `dashboard`). `dashboard` additionally uses [Testing Library](https://testing-library.com) (`@testing-library/react`, `@testing-library/jest-dom`) for component tests in a `jsdom` environment. `shared`/`sdk`/`server` run in the plain `node` environment (`sdk` uses `jsdom` since it's browser-facing).

## Running tests

```bash
pnpm test              # run every package's tests via Turbo
pnpm --filter @flowmvp/dashboard test   # single package
pnpm --filter @flowmvp/server test -- --watch   # watch mode (pass flags after --)
```

CI runs `pnpm typecheck && pnpm test` on every push and pull request (`.github/workflows/test.yml`).

## Test layers

- **Unit tests** — colocated with source as `*.test.ts`/`*.test.tsx` (e.g. `packages/server/src/services/csv.test.ts`). Cover pure functions and business logic with real inputs/outputs, not `toBeDefined()` filler.
- **Component tests** (`dashboard` only) — render with `@testing-library/react`, assert on user-visible behavior (DOM state, callback calls) rather than internal implementation details.
- **Integration/E2E** — not set up yet. Add when a flow needs it (e.g. server route + DB).

## Conventions

- File naming: `<subject>.test.ts` / `<subject>.test.tsx`, next to the file it tests.
- Test names and `describe` blocks are written in Korean, matching the project's Korean-first commenting convention (`CLAUDE.md`).
- Prefer `fireEvent` over `userEvent` for native `<input type="date">`/`<input type="time">` — these need direct `.value` assignment, which `userEvent.type` doesn't handle reliably.
- No mocking of internal modules unless a real dependency (network, DB) is unavailable in the test environment.
