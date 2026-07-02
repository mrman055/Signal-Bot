# Signal Bot

A trading signal bot that monitors crypto, forex, and commodity pairs — delivering real-time BUY/SELL/NEUTRAL signals with confidence scores, technical indicator breakdowns, candlestick data, price alerts, and watchlist management.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/trading-bot run dev` — run the frontend (port 20883, preview at /trading-bot/)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `TWELVE_DATA_API_KEY` — for live market data (falls back to seeded synthetic data)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (artifacts/api-server)
- Frontend: React + Vite + Tailwind CSS (artifacts/trading-bot)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in lib/api-spec/openapi.yaml)
- Build: esbuild (CJS bundle)
- Charts: Recharts + custom candlestick component (lightweight-charts)

## Where things live

- `artifacts/api-server/src/lib/` — market data fetching, signal computation engine, technical analysis, monitor state
- `artifacts/api-server/src/routes/` — signals, pairs, recommendation, monitor, watchlist, alerts, analytics
- `artifacts/trading-bot/src/pages/` — dashboard, signals, signal-detail, watchlist, alerts
- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not hand-edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not hand-edit)
- `lib/db/src/schema/` — DB tables: watchlist, alerts

## Architecture decisions

- Market data falls back to deterministic seeded synthetic candles when `TWELVE_DATA_API_KEY` is absent — the app is fully usable without an API key.
- Signal cache TTL is 5 minutes; cache is busted if live data becomes available for the first time.
- Alerts and watchlist are persisted in Postgres; signals/monitor state are in-memory.
- All API contracts are defined in OpenAPI first; never write hooks or Zod types by hand.

## Product

- **Dashboard** — top recommendation + live signal overview across all markets
- **Signals** — filterable list of all tracked pairs with direction/strength
- **Signal Detail** — per-symbol deep dive with candlestick chart, indicators, and trade targets
- **Watchlist** — user-curated list of pairs to track closely
- **Alerts** — price alerts that trigger when a signal hits a configured confidence threshold

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/db run push` after any schema change before testing locally.
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before working on the frontend.
- Do not add leaf workspace packages to the root `tsconfig.json` references.
- `pnpm run typecheck:libs` must pass before artifact typechecks (stale lib declarations cause false failures).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
