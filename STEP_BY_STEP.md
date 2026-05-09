# Step-by-step implementation path

Use this file as a **sequenced build plan**. Day-to-day commands (env, install, DB, dev servers) stay in [`NEXT_STEPS.md`](./NEXT_STEPS.md).

**Hybrid rule:** matching, order book, and simulated balances stay **off-chain** (API + Postgres). Swaps, LP, and staking hit **devnet** only when the user **signs** a transaction.

---

## Baseline (already in the repo)

- [x] Turborepo + `apps/web`, `apps/api`, `apps/contracts`, shared `packages/*`
- [x] Prisma schema + migrations + seed (Neon-ready)
- [x] API skeleton (Fastify + Socket.IO) + health route
- [x] Terminal **UI shell**: `/trade`, `/portfolio`, `/swap`, `/liquidity`, `/staking`, `/settings` + landing `/`

---

## Phase A — API contracts for the frontend

Work in `apps/api` and `packages/types`.

1. [x] Add **Prisma client** singleton (e.g. `apps/api/src/lib/prisma.ts`) and use it in routes.
2. [x] Expose **read-only REST** aligned with your UI:
   - [x] `GET /pairs` — list pairs (from DB; use seed slug `ETH-USDC` first).
   - [x] `GET /pairs/:slug/orderbook` — mock or DB-backed top-of-book (stub OK, then real).
   - [x] `GET /pairs/:slug/trades` — recent trades (empty array OK at first).
   - [x] `GET /pairs/:slug/candles?interval=H1` — OHLC from `Candle` table.
3. [x] Add **Zod** validation for query params; return shared `ApiError` shape from `packages/types`.
4. [x] **Smoke-test** with curl or the browser against `NEXT_PUBLIC_API_URL`.

---

## Phase B — Real-time market layer

Still in `apps/api`; optional **Redis** later for pub/sub across instances.

5. [x] Namespace or tag Socket.IO events (e.g. `pair:ETH-USDC:ticker`, `orderbook:delta`).
6. [x] On a timer or on write, **emit** mock or DB-driven ticker + book updates for one pair.
7. [x] In `apps/web`, add a small **Socket.IO client** hook (e.g. `useMarketSocket`) and show **live last price** in the trade header.

---

## Phase C — Charts on `/trade`

8. [x] Add **TradingView Lightweight Charts** (or your chosen library) dependency to `apps/web`.
9. [x] Create a **client** chart component; fetch candles from `GET /pairs/:slug/candles`.
10. [x] Replace the chart placeholder panel on `/trade` with the real component.

---

## Phase D — Wallet connect (no keys on server)

Work in `apps/web` and `packages/blockchain`.

11. [x] Add **Wagmi + Viem + RainbowKit** (or your preferred stack); read `NEXT_PUBLIC_CHAIN_ID` and `NEXT_PUBLIC_RPC_URL` from env.
12. [x] Wrap the app with providers (client layout or `providers.tsx`).
13. [x] Replace **Connect wallet** in `terminal-app-shell.tsx` with RainbowKit’s connect button.
14. [x] **Optional:** `POST /wallets/link` + session cookie/JWT to associate `address` with a `User` in Prisma (no private key ever on API).

---

## Phase E — Orders (simulator MVP)

15. [x] `POST /orders` — create limit/market order in DB (`Order` model); validate body with Zod.
16. [x] **Matcher** — in-process module: match against resting orders for the same pair, write `Trade` rows, update `Order` status and `Balance` (simulated).
17. [x] `DELETE /orders/:id` — cancel if still open.
18. [x] Wire **order entry** on `/trade` to the API; refresh book/trades (REST poll or WS).

---

## Phase F — Portfolio & settings

19. [x] `GET /user/balances` or `GET /wallets/:address/balances` — read `Balance` + `Token` for the linked user.
20. [x] Fill `/portfolio` table from that API.
21. [x] `/settings` — show resolved public env (non-secret) or chain name; link to docs for RPC.

---

## Phase G — Smart contracts (devnet)

Work in `apps/contracts` + `packages/blockchain`.

22. [x] ERC-20 **demo tokens** + minimal **factory** or fixed deploy script.
23. [x] **AMM** (Uniswap V2–style) `Factory` / `Pair` / `Router` **or** a minimal `Router` + one pool — keep scope small and tested.
24. [x] **Deploy** to your devnet; write addresses to `packages/blockchain` (or env) — **no secrets** in git.
25. [x] `/swap` — use Wagmi to call `swapExactTokensForTokens` (or your router ABI); show tx status and link to explorer.

---

## Phase H — Liquidity & staking UI

26. [ ] `/liquidity` — add/remove liquidity txs against router/pair; reflect in UI from receipts or indexer.
27. [ ] **Staking** contract (simple lock + reward) + `/staking` page calling it.
28. [ ] **Optional:** `apps/indexer` worker — listen for `Swapped`, `Mint`, `Burn`, `Staked` and upsert `OnchainTransaction` / audit rows.

---

## Phase I — Terminal polish (portfolio quality)

29. [ ] **Resizable** panels (e.g. `react-resizable-panels`) on `/trade`.
30. [ ] **Command palette** (⌘K) — jump to pair, route, or actions.
31. [ ] **Keyboard shortcuts** for buy/sell focus, cancel, etc.
32. [ ] **Virtualized** order book rows if depth gets large.
33. [ ] **Rate limiting** + auth on write routes; Redis for limiter backend if needed.
34. [ ] **CI** — GitHub Actions: `lint`, `typecheck`, `build`, contract tests.

---

## Quick reference

| Doc / area        | Role                                      |
| ----------------- | ----------------------------------------- |
| [`NEXT_STEPS.md`](./NEXT_STEPS.md) | Env, pnpm, DB, run dev servers            |
| [`STEP_BY_STEP.md`](./STEP_BY_STEP.md) | This file — **what to build next, in order** |
| [`apps/web/app/(terminal)/`](./apps/web/app/(terminal)/) | Terminal routes                           |
| [`apps/api/`](./apps/api/) | REST + Socket.IO + Prisma                 |
| [`apps/contracts/`](./apps/contracts/) | Solidity + Hardhat                        |

Check boxes as you finish steps; adjust ordering if you prefer swap-before-orders, but keep **A → B → C** (API + live data + chart) before heavy wallet/order logic so the UI always has something real to show.
