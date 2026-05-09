import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";
import { createPublicClient, http, type Address, type Hash } from "viem";
import { DEFAULT_PUBLIC_CHAIN_ID, DEFAULT_PUBLIC_RPC_URL, createDexChain, getDemoDexAddresses } from "@dex-terminal/blockchain";

const prisma = new PrismaClient();
const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? DEFAULT_PUBLIC_CHAIN_ID);
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? process.env.SEPOLIA_RPC_URL ?? DEFAULT_PUBLIC_RPC_URL;
const addresses = getDemoDexAddresses({
  NEXT_PUBLIC_CHAIN_ID: String(chainId),
  NEXT_PUBLIC_DEMO_SWAP_ROUTER_ADDRESS: process.env.NEXT_PUBLIC_DEMO_SWAP_ROUTER_ADDRESS,
  NEXT_PUBLIC_DEMO_STAKING_ADDRESS: process.env.NEXT_PUBLIC_DEMO_STAKING_ADDRESS,
});
const client = createPublicClient({
  chain: createDexChain({ chainId, rpcUrl }),
  transport: http(rpcUrl),
});

const routerEventAbi = [
  {
    type: "event",
    name: "Swap",
    inputs: [
      { name: "sender", type: "address", indexed: true },
      { name: "tokenIn", type: "address", indexed: true },
      { name: "amountIn", type: "uint256", indexed: false },
      { name: "amountOut", type: "uint256", indexed: false },
      { name: "to", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "LiquidityAdded",
    inputs: [
      { name: "provider", type: "address", indexed: true },
      { name: "amount0", type: "uint256", indexed: false },
      { name: "amount1", type: "uint256", indexed: false },
      { name: "shares", type: "uint256", indexed: false },
      { name: "to", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "LiquidityRemoved",
    inputs: [
      { name: "provider", type: "address", indexed: true },
      { name: "amount0", type: "uint256", indexed: false },
      { name: "amount1", type: "uint256", indexed: false },
      { name: "shares", type: "uint256", indexed: false },
      { name: "to", type: "address", indexed: true },
    ],
  },
] as const;

const stakingEventAbi = [
  {
    type: "event",
    name: "Staked",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Withdrawn",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RewardPaid",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

function stringifyBigInts(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value, (_key, item: unknown) => (typeof item === "bigint" ? item.toString() : item)),
  ) as Prisma.InputJsonValue;
}

async function recordEvent({
  txHash,
  blockNumber,
  contractAddress,
  eventName,
  actor,
  args,
}: {
  txHash: Hash;
  blockNumber: bigint;
  contractAddress: Address;
  eventName: string;
  actor: Address | undefined;
  args: Record<string, unknown>;
}) {
  await prisma.onchainTransaction.upsert({
    where: { txHash },
    update: {
      blockNumber,
      fromAddress: actor?.toLowerCase() ?? null,
      toAddress: contractAddress.toLowerCase(),
      method: eventName,
      status: "CONFIRMED",
      raw: stringifyBigInts(args),
    },
    create: {
      txHash,
      chainId,
      blockNumber,
      fromAddress: actor?.toLowerCase() ?? null,
      toAddress: contractAddress.toLowerCase(),
      method: eventName,
      status: "CONFIRMED",
      raw: stringifyBigInts(args),
    },
  });
  await prisma.auditLog.create({
    data: {
      action: `onchain.${eventName}`,
      entityType: "OnchainTransaction",
      entityId: txHash,
      metadata: stringifyBigInts({ chainId, contractAddress, args }),
    },
  });
}

function actorFromArgs(args: Record<string, unknown>) {
  const value = args.sender ?? args.provider ?? args.user;
  return typeof value === "string" && value.startsWith("0x") ? (value as Address) : undefined;
}

function watchRouter() {
  if (addresses.demoSwapRouter === undefined) {
    console.warn("[indexer] NEXT_PUBLIC_DEMO_SWAP_ROUTER_ADDRESS is missing; router watcher disabled.");
    return () => undefined;
  }
  const routerAddress = addresses.demoSwapRouter;

  return client.watchContractEvent({
    address: routerAddress,
    abi: routerEventAbi,
    onLogs: (logs) => {
      for (const log of logs) {
        void recordEvent({
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          contractAddress: routerAddress,
          eventName: log.eventName,
          actor: actorFromArgs(log.args),
          args: log.args,
        }).catch((error: unknown) => console.error("[indexer] router event write failed", error));
      }
    },
    onError: (error) => console.error("[indexer] router watcher failed", error),
  });
}

function watchStaking() {
  if (addresses.demoStaking === undefined) {
    console.warn("[indexer] NEXT_PUBLIC_DEMO_STAKING_ADDRESS is missing; staking watcher disabled.");
    return () => undefined;
  }
  const stakingAddress = addresses.demoStaking;

  return client.watchContractEvent({
    address: stakingAddress,
    abi: stakingEventAbi,
    onLogs: (logs) => {
      for (const log of logs) {
        void recordEvent({
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          contractAddress: stakingAddress,
          eventName: log.eventName,
          actor: actorFromArgs(log.args),
          args: log.args,
        }).catch((error: unknown) => console.error("[indexer] staking event write failed", error));
      }
    },
    onError: (error) => console.error("[indexer] staking watcher failed", error),
  });
}

const unwatch = [watchRouter(), watchStaking()];

async function shutdown() {
  for (const stop of unwatch) {
    stop();
  }
  await prisma.$disconnect();
  process.exit(0);
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

console.info("[indexer] watching demo router and staking events", {
  chainId,
  router: addresses.demoSwapRouter,
  staking: addresses.demoStaking,
});
