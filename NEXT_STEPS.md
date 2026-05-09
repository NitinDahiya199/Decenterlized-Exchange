# Next steps — DEX Terminal (dev)

Your environment file is set up. Use this checklist to run the stack and decide what to build next.

For a **sequenced build plan** (phases A–I, checkboxes), see [`STEP_BY_STEP.md`](./STEP_BY_STEP.md).

## 1. Safety check (env)

- Keep real URLs, API keys, and wallet keys **out of git**. The repo ignores `.env`, `.ENV`, and `.env.local`.
- Put your real values in **`.env` or `.ENV` at the repo root** (same folder as `pnpm-workspace.yaml`). The API package loads those files automatically for Prisma and `pnpm dev` (via `dotenv-cli`), so you do **not** need a second copy under `apps/api/`.
- Prisma’s CLI **does not** load a root `.ENV` by itself when you run bare `npx prisma …` from `apps/api` — use the **`db:*` scripts** below instead.
- Align keys with [`.env.example`](./.env.example): `DATABASE_URL`, `REDIS_URL`, `API_*`, `NEXT_PUBLIC_*`, and (later) `NEXT_PUBLIC_RPC_URL` / `PRIVATE_KEY` only on your machine for Hardhat deploys.

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

With **`DATABASE_URL` in the repo root** `.env` or `.ENV`, run Prisma **through the API package scripts** (they load `../../.env` and `../../.ENV`):

From **repo root** (recommended):

```bash
npx pnpm@9.15.0 --filter @dex-terminal/api run db:deploy
npx pnpm@9.15.0 --filter @dex-terminal/api run db:seed
```

Or from **`apps/api`**:

```bash
pnpm run db:deploy
pnpm run db:seed
```

- **First time / schema changes in dev:** `pnpm run db:migrate` (or `npx pnpm@9.15.0 --filter @dex-terminal/api run db:migrate`) instead of `db:deploy`.
- **Neon:** use the connection string from the Neon dashboard (SSL is typical).
- **Local Postgres:** start `docker compose up -d postgres`, then use the local URL commented in `.env.example`.

Optional: `npx pnpm@9.15.0 --filter @dex-terminal/api run db:studio` to inspect tables after seeding.

**If you still see `Environment variable not found: DATABASE_URL`:** confirm the variable name is exactly `DATABASE_URL`, the file is at the **monorepo root**, and the file is named `.env` or `.ENV` (scripts load both). Avoid running bare `npx prisma migrate deploy` from `apps/api` unless you have already `export`ed `DATABASE_URL` in the shell.

## 4. Run the apps

Use **two terminals**. From the **repo root** (`Decenterlized Exchange/`):

**If `pnpm: command not found`** (common on Windows until pnpm is installed globally), use the same runner as in steps 2–3:

```bash
# Terminal A — API (Fastify + Socket.IO)
npx pnpm@9.15.0 --filter @dex-terminal/api dev

# Terminal B — Next.js
npx pnpm@9.15.0 --filter @dex-terminal/web dev
```

**If `pnpm` is on your PATH:**

```bash
pnpm --filter @dex-terminal/api dev
pnpm --filter @dex-terminal/web dev
```

**Alternative — run each package without `--filter`** (still need `npx pnpm@9.15.0` if `pnpm` is missing):

```bash
# Terminal A
cd apps/api && npx pnpm@9.15.0 run dev

# Terminal B
cd apps/web && npx pnpm@9.15.0 run dev
```

**Optional — install pnpm once** (then `pnpm` works everywhere):

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

If `corepack` hits permission errors on Windows, keep using `npx pnpm@9.15.0` for all commands.

Smoke checks:

- API: open `http://localhost:4000/health` (or your `API_PORT`) — expect JSON with `ok: true`.
- Web: open `http://localhost:3000` — landing page; use **Open terminal** or go to `/trade`.

**Redis:** optional until you add caching / rate limiting / Socket.IO Redis adapter. When you do, run `docker compose up -d redis` and set `REDIS_URL`.

## 5. Trading UI (Next.js App Router)

The **desktop terminal shell** lives under `apps/web`:

| Route         | Purpose                                              |
| ------------- | ---------------------------------------------------- |
| `/`           | Landing — links into the terminal                    |
| `/trade`      | Chart + order book + order entry + tape + watchlist  |
| `/portfolio`  | Holdings / allocation / positions (wire to API)    |
| `/swap`       | AMM-style swap panel (Wagmi + router later)        |
| `/liquidity`  | Add/remove LP (contracts later)                      |
| `/staking`    | Stake / rewards (contracts later)                    |
| `/settings`   | Network hints · session (wallet link later)          |

Implementation files (high level):

- [`apps/web/app/(terminal)/layout.tsx`](./apps/web/app/(terminal)/layout.tsx) — wraps all terminal routes
- [`apps/web/components/terminal/terminal-app-shell.tsx`](./apps/web/components/terminal/terminal-app-shell.tsx) — sidebar, top bar, “Connect wallet” placeholder
- [`apps/web/components/terminal/glass-panel.tsx`](./apps/web/components/terminal/glass-panel.tsx) — shared panel chrome
- Per-route `page.tsx` under [`apps/web/app/(terminal)/`](./apps/web/app/(terminal)/)

**Hybrid architecture (reminder):** fast **off-chain** order book + DB state in the API; **devnet** txs only when the user signs (swap, LP, stake). Keep that boundary clear in README / portfolio copy.

**Next UI tasks:** resizable panels, command palette, lightweight-charts, live Socket.IO book/ticker, RainbowKit on `Connect wallet`.

## 6. Repo-wide commands

From root:

```bash
npx pnpm@9.15.0 build       # all packages (Turbo); or `pnpm build` if pnpm is on PATH
npx pnpm@9.15.0 lint
npx pnpm@9.15.0 typecheck
npx pnpm@9.15.0 format      # Prettier
```

**`npm warn Unknown project config "shamefully-hoist"`** when using `npx` + npm: harmless; those keys are for **pnpm** (`/.npmrc`). Ignore or run commands via `npx pnpm@9.15.0` only.

**Contracts `typecheck`:** `apps/contracts/tsconfig.json` limits ambient types to `"types": ["node"]` so `tsc` does not pull a broken implicit `minimatch` stub.

## 7. Suggested implementation order (after scaffolding)

1. ~~**Terminal UI shell**~~ — first pass: routes + layout + glass panels (**done**).
2. **Charts + live data** — lightweight-charts + REST candles + Socket.IO ticker.
3. **Auth + wallet linking** — RainbowKit / Wagmi; linked address in DB; no keys on API.
4. **Order book + matcher** — REST/WS + Prisma orders/trades.
5. **Contracts slice** — ERC-20 + AMM router on devnet; swap/LP pages call contracts.
6. **Redis + scale** — pub/sub for WS; rate limits.

## 8. Troubleshooting

| Issue                              | What to try                                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Prisma `P1000` / connection errors | Confirm DB is up, `DATABASE_URL` user/password/database name, firewall, Neon project active.              |
| Web can’t reach API                | Match `NEXT_PUBLIC_API_URL` to API host/port; check `API_ORIGIN` for CORS.                                |
| Socket fails from browser          | Use same origin policy as configured CORS; `NEXT_PUBLIC_WS_URL` should point at the API Socket.IO server. |
| `pnpm` not found                   | `corepack enable` + `corepack prepare pnpm@9.15.0 --activate`, or use `npx pnpm@9.15.0` as above.           |
| `tsc` / minimatch in contracts     | Use repo `apps/contracts` tsconfig; run `npx pnpm@9.15.0 install` after pull.                             |

## 9. When you’re ready to ship a portfolio demo

- Record a short Loom or GIF: connect wallet → see live ticker / book → place simulated order.
- Add a one-paragraph “Architecture” section (hybrid off-chain book + devnet contracts).
- Deploy web + API to a free tier (e.g. Vercel + Railway/Fly) with **Neon** and **no real funds**.

---

_Generated for local development. Do not commit secrets or production keys._
