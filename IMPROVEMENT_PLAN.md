# Improvement Plan

Use this file after completing the original Phase A-I checklist. These steps focus on making the DEX terminal more reliable, testable, secure, and demo-ready.

## Phase J - Documentation Sync

1. [x] Mark Phase H/I complete in `STEP_BY_STEP.md`.
   - Check off liquidity, staking, indexer, terminal polish, rate limiting, and CI items.
   - Add a short note if any feature is MVP-only or needs production hardening.

2. [x] Update project docs with current architecture.
   - Document the hybrid model: off-chain order book and simulated balances, on-chain swaps/liquidity/staking.
   - Add deployed Sepolia contract addresses.
   - Explain which environment values are public and which must stay secret.

## Phase K - Deeper Test Coverage

3. [x] Add API tests for authenticated write routes.
   - `POST /orders` rejects missing sessions.
   - `POST /orders` rejects wallet addresses that do not match the session.
   - `DELETE /orders/:id` rejects cancellation by a different user.
   - Valid linked sessions can place and cancel orders.

4. [x] Add API tests for rate limiting.
   - Verify conservative limits apply to `POST /orders`, `DELETE /orders/:id`, and `POST /wallets/link`.
   - Verify rate limit responses use the shared `ApiError` shape.

5. [x] Add web tests for liquidity and staking UI.
   - Mock Wagmi contract reads/writes.
   - Verify approve/add/remove liquidity flows.
   - Verify approve/stake/withdraw/claim flows.
   - Verify tx pending/success/error states render correctly.

6. [x] Add indexer tests.
   - Mock viem logs for swap, liquidity, and staking events.
   - Verify `OnchainTransaction` upserts.
   - Verify `AuditLog` rows are written with serialized bigint metadata.

## Phase L - Indexer Reliability

7. [x] Add persisted indexer cursor state.
   - Store the latest indexed block per chain/contract.
   - Use a Prisma table or a small `IndexerCursor` model.

8. [x] Add startup backfill.
   - On boot, read from the last indexed block.
   - Fetch historical logs up to the current block.
   - Continue with live watchers after backfill completes.

9. [x] Add retry handling.
   - Retry failed log writes with exponential backoff.
   - Log failures with enough context to replay manually.
   - Avoid advancing the cursor past failed blocks.

10. [x] Add idempotency protections.
   - Use transaction hash plus log index as the unique event key if needed.
   - Keep `OnchainTransaction.txHash` unique, but allow multiple audit events per tx.

## Phase M - Production Rate Limiting And Realtime Scaling

11. [x] Use Redis for production API rate limiting.
   - Configure `@fastify/rate-limit` with Redis when `REDIS_URL` is present.
   - Keep the in-memory limiter only for local development.

12. [x] Use Redis for Socket.IO scaling.
   - Add the Socket.IO Redis adapter.
   - Publish market refresh events across API instances.
   - Keep single-process behavior for local dev.

13. [x] Add Redis health checks.
   - Show Redis connectivity in API startup logs.
   - Add degraded-mode behavior if Redis is unavailable in development.

## Phase N - Wallet Auth Hardening

14. [x] Add wallet sign-in challenge endpoints.
   - `GET /wallets/nonce?address=...`
   - `POST /wallets/verify` with address, message, signature, chain ID, and nonce.

15. [x] Verify wallet ownership before linking.
   - Use Viem signature recovery or SIWE-style verification.
   - Expire nonces after use.
   - Store verified sessions in the existing signed cookie flow.

16. [x] Require verified sessions for order writes.
   - `POST /orders` should require a verified wallet session.
   - `DELETE /orders/:id` should enforce user ownership.
   - Keep private keys entirely out of the API.

## Phase O - Order Management UI

17. [x] Add order history API.
   - `GET /orders?status=open`
   - `GET /orders?status=history`
   - Return pair, side, type, status, price, quantity, filled quantity, and timestamps.

18. [x] Add open orders UI on `/trade`.
   - Show active orders for the linked wallet.
   - Include cancel buttons tied to `DELETE /orders/:id`.
   - Refresh order book, recent trades, and open orders after cancellation.

19. [x] Add order history UI.
   - Show filled, cancelled, rejected, and partially filled orders.
   - Add basic filtering by status and pair.

## Phase P - Portfolio Improvements

20. [x] Show on-chain LP position data.
   - Read LP share balance from the router.
   - Read pool reserves and total LP supply.
   - Estimate the user's underlying dWETH/dUSDC position.

21. [x] Show staking position data.
   - Read staked dWETH balance.
   - Read earned dUSDC rewards.
   - Show claimable rewards and last known tx state.

22. [x] Combine simulated and on-chain balances.
   - Keep simulated trading balances clearly labeled.
   - Keep devnet wallet positions clearly labeled.
   - Avoid presenting devnet assets as real funds.

## Phase Q - Deployment Polish

23. [x] Add environment validation.
   - Validate required API env values at startup.
   - Validate required web public env values during build.
   - Fail fast with clear messages when config is missing.

24. [x] Add deployment notes.
   - Vercel for `apps/web`.
   - Railway/Fly/Render for `apps/api` and `apps/indexer`.
   - Neon or managed Postgres for Prisma.
   - Redis provider for rate limits and Socket.IO scaling.

25. [x] Add production health checks.
   - API health should verify database connectivity.
   - Indexer health should expose current chain, latest indexed block, and watcher status.
   - Add deployment platform health check paths where supported.

26. [x] Add README architecture notes.
   - Include a diagram or short explanation of web, API, DB, indexer, contracts, and wallet flows.
   - Document what is simulated and what is on-chain.
   - Include a short portfolio demo script.

## Suggested Order

1. Documentation sync.
2. API auth/rate-limit tests.
3. Wallet signature verification.
4. Order history and open orders UI.
5. Indexer cursor/backfill/retry.
6. Portfolio LP/staking aggregation.
7. Redis scaling.
8. Deployment docs and health checks.

## Verification Checklist

- [x] `corepack pnpm --filter @dex-terminal/api lint`
- [x] `corepack pnpm --filter @dex-terminal/api typecheck`
- [x] `corepack pnpm --filter @dex-terminal/web lint`
- [x] `corepack pnpm --filter @dex-terminal/web typecheck`
- [x] `corepack pnpm --filter @dex-terminal/indexer lint`
- [x] `corepack pnpm --filter @dex-terminal/indexer typecheck`
- [x] `corepack pnpm --filter @dex-terminal/contracts test`
- [ ] Smoke-test `/trade`, `/portfolio`, `/liquidity`, `/staking`, and `/settings`.
