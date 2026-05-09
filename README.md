# DEX Terminal

A hybrid decentralized exchange terminal demo. The trading terminal keeps matching, order books, recent trades, and simulated balances off-chain in the API and Postgres. Wallet-signed actions for swaps, liquidity, and staking run on Sepolia devnet contracts.

## Architecture

- `apps/web`: Next.js terminal UI for trade, portfolio, swap, liquidity, staking, and settings.
- `apps/api`: Fastify REST API, Socket.IO market stream, Prisma data access, wallet sessions, order matching, and write-route protection.
- `apps/indexer`: Viem-based worker that indexes router and staking events into Prisma audit/on-chain tables.
- `apps/contracts`: Hardhat Solidity contracts for demo ERC-20s, swap router, LP shares, and staking.
- `packages/types`: Shared Zod schemas and API types.
- `packages/blockchain`: Public chain config, contract ABIs, and deployed demo addresses.

## Hybrid Model

- Off-chain: order creation, matching, order book, recent trades, candles, simulated balances, and portfolio balance rows.
- On-chain: user-signed devnet swaps, liquidity add/remove, staking, withdrawing, and reward claiming.
- Never store private keys on the API. Local deploy keys belong only in ignored `.env` / `.ENV` files.

## Sepolia Demo Contracts

- dWETH: `0xCf70E926Bff6eA9f28567D57C9C4C84532e9581F`
- dUSDC: `0x2290aaF33aF157aFd6e4Bcd1f631A8DeD8d402ba`
- Swap router: `0x27ed77Da6015C1fc2012651BD851Afaa9D6BBC70`
- Staking: `0x728111718e90A651f28F08cA082f65637F242270`

## Environment

Public browser-safe values use `NEXT_PUBLIC_*`, including API URL, websocket URL, chain ID, RPC URL, and deployed contract addresses. Secrets such as `DATABASE_URL`, `REDIS_URL`, `SESSION_SECRET`, and deployer `PRIVATE_KEY` must stay out of git.

Use `.env.example` as the template and keep real values in ignored `.env` or `.ENV` files.

## Portfolio Demo Script

1. Start API and web from the repo root.
2. Connect a Sepolia wallet in the terminal header.
3. Open `/trade` to see chart, ticker, order book, order entry, and recent trades.
4. Place a simulated order and confirm open/history order state.
5. Open `/swap`, `/liquidity`, or `/staking` to sign devnet transactions.
6. Open `/portfolio` to view simulated balances plus on-chain LP/staking positions.

## Deployment Notes

- Deploy `apps/web` to Vercel.
- Deploy `apps/api` and `apps/indexer` to Railway, Fly, Render, or a similar Node host.
- Use Neon or managed Postgres for Prisma.
- Use managed Redis for production rate limiting and Socket.IO scaling.
- Configure platform health checks against the API `/health` route and indexer status logs.
