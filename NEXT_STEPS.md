# Next steps — DEX Terminal (dev)

Your environment file is set up. Use this checklist to run the stack and decide what to build next.

## 1. Safety check (env)

- Keep real URLs, API keys, and wallet keys **out of git**. The repo ignores `.env` and `.env.local`; if you use a different name (e.g. `.ENV`), add it to [`.gitignore`](./.gitignore) or rename to `.env`.
- Align values with [`.env.example`](./.env.example): `DATABASE_URL`, `REDIS_URL`, `API_*`, `NEXT_PUBLIC_*`, and (later) `NEXT_PUBLIC_RPC_URL` / `PRIVATE_KEY` only on your machine for Hardhat deploys.

**Quick sanity checks**

- `DATABASE_URL` — valid Postgres (Neon or local Docker from [`docker-compose.yml`](./docker-compose.yml)).
- `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` — match where the API listens (`API_PORT`, usually `http://localhost:4000`).
- `API_ORIGIN` — your web origin (usually `http://localhost:3000`) for Socket.IO CORS.

## 2. Install dependencies

From the repo root:

```bash
pnpm install
```

If `pnpm` is not on your PATH, use:

```bash
npx pnpm@9.15.0 install
```

## 3. Database (Prisma)

From repo root, with `DATABASE_URL` exported or loaded from your env file:

```bash
cd apps/api
npx prisma migrate deploy
npx prisma db seed
```

- **First time / schema changes in dev:** you can use `npx prisma migrate dev` instead of `deploy` (creates/applies migrations interactively).
- **Neon:** use the connection string from the Neon dashboard (SSL is typical).
- **Local Postgres:** start `docker compose up -d postgres`, then use the local URL commented in `.env.example`.

Optional: `npx prisma studio` (from `apps/api`) to inspect tables after seeding.

## 4. Run the apps

Easiest is two terminals (API + web):

```bash
# Terminal A — API (Fastify + Socket.IO)
pnpm --filter @dex-terminal/api dev

# Terminal B — Next.js
pnpm --filter @dex-terminal/web dev
```

Smoke checks:

- API: open `http://localhost:4000/health` (or your `API_PORT`) — expect JSON with `ok: true`.
- Web: open `http://localhost:3000` — scaffold page should load.

**Redis:** optional until you add caching / rate limiting / Socket.IO Redis adapter. When you do, run `docker compose up -d redis` and set `REDIS_URL`.

## 5. Repo-wide commands

From root:

```bash
pnpm build      # all packages (Turbo)
pnpm lint
pnpm typecheck
pnpm format     # Prettier
```

## 6. Suggested implementation order (after scaffolding)

1. **Terminal UI shell** — layout, dark theme, resizable panels (desktop-first).
2. **Auth + wallet linking** — connect wallet, store linked address server-side; no private keys on the API.
3. **Market data** — REST + Socket.IO tickers, order book snapshots, trade stream (start mocked or DB-backed).
4. **Charts** — candle endpoint + client chart (e.g. TradingView lightweight charts).
5. **Orders** — REST for place/cancel; matcher updates DB + broadcasts on Socket.IO.
6. **Contracts slice** — ERC-20 demo, AMM/router on devnet; client submits txs; indexer optional.

Keep the **hybrid model** clear in docs: off-chain book + simulated balances for speed; on-chain actions only when the user signs a devnet transaction.

## 7. Troubleshooting

| Issue | What to try |
|--------|-------------|
| Prisma `P1000` / connection errors | Confirm DB is up, `DATABASE_URL` user/password/database name, firewall, Neon project active. |
| Web can’t reach API | Match `NEXT_PUBLIC_API_URL` to API host/port; check `API_ORIGIN` for CORS. |
| Socket fails from browser | Use same origin policy as configured CORS; `NEXT_PUBLIC_WS_URL` should point at the API Socket.IO server. |
| `pnpm` not found | `corepack enable` + `corepack prepare pnpm@9.15.0 --activate`, or use `npx pnpm@9.15.0` as above. |

## 8. When you’re ready to ship a portfolio demo

- Record a short Loom or GIF: connect wallet → see live ticker / book → place simulated order.
- Add a one-paragraph “Architecture” section (hybrid off-chain book + devnet contracts).
- Deploy web + API to a free tier (e.g. Vercel + Railway/Fly) with **Neon** and **no real funds**.

---

*Generated for local development. Do not commit secrets or production keys.*
