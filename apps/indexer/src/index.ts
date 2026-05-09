import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createPublicClient, http, type Address, type Hash } from "viem";
import { DEFAULT_PUBLIC_CHAIN_ID, DEFAULT_PUBLIC_RPC_URL, createDexChain, getDemoDexAddresses } from "@dex-terminal/blockchain";
import { buildEventKey, stringifyBigInts } from "./lib/event-utils.js";

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
const START_BLOCK_LOOKBACK = BigInt(process.env.INDEXER_START_BLOCK_LOOKBACK ?? 2_000);
const MAX_WRITE_ATTEMPTS = 3;

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

async function recordEvent({
  txHash,
  blockNumber,
  logIndex,
  contractAddress,
  eventName,
  actor,
  args,
}: {
  txHash: Hash;
  blockNumber: bigint;
  logIndex: number;
  contractAddress: Address;
  eventName: string;
  actor: Address | undefined;
  args: Record<string, unknown>;
}) {
  const eventKey = buildEventKey(txHash, logIndex);
  await prisma.onchainTransaction.upsert({
    where: { txHash },
    update: {
      blockNumber,
      fromAddress: actor?.toLowerCase() ?? null,
      toAddress: contractAddress.toLowerCase(),
      method: eventName,
      status: "CONFIRMED",
      raw: stringifyBigInts({ eventKey, args }),
    },
    create: {
      txHash,
      chainId,
      blockNumber,
      fromAddress: actor?.toLowerCase() ?? null,
      toAddress: contractAddress.toLowerCase(),
      method: eventName,
      status: "CONFIRMED",
      raw: stringifyBigInts({ eventKey, args }),
    },
  });
  const existingAudit = await prisma.auditLog.findFirst({
    where: {
      action: `onchain.${eventName}`,
      entityType: "OnchainTransaction",
      entityId: eventKey,
    },
  });
  if (existingAudit === null) {
    await prisma.auditLog.create({
      data: {
        action: `onchain.${eventName}`,
        entityType: "OnchainTransaction",
        entityId: eventKey,
        metadata: stringifyBigInts({ chainId, txHash, logIndex, contractAddress, args }),
      },
    });
  }
}

function actorFromArgs(args: Record<string, unknown>) {
  const value = args.sender ?? args.provider ?? args.user;
  return typeof value === "string" && value.startsWith("0x") ? (value as Address) : undefined;
}

type IndexedLog = {
  transactionHash: Hash;
  blockNumber: bigint;
  logIndex: number;
  eventName: string;
  args: Record<string, unknown>;
};

async function writeWithRetry(log: IndexedLog, contractAddress: Address) {
  let attempt = 0;
  while (attempt < MAX_WRITE_ATTEMPTS) {
    try {
      await recordEvent({
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        logIndex: log.logIndex,
        contractAddress,
        eventName: log.eventName,
        actor: actorFromArgs(log.args),
        args: log.args,
      });
      return;
    } catch (error) {
      attempt += 1;
      if (attempt >= MAX_WRITE_ATTEMPTS) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    }
  }
}

async function getCursor(contractAddress: Address, eventGroup: string, currentBlock: bigint) {
  const cursor = await prisma.indexerCursor.findUnique({
    where: {
      chainId_contractAddress_eventGroup: {
        chainId,
        contractAddress: contractAddress.toLowerCase(),
        eventGroup,
      },
    },
  });

  if (cursor !== null) {
    return cursor.lastBlock + 1n;
  }

  return currentBlock > START_BLOCK_LOOKBACK ? currentBlock - START_BLOCK_LOOKBACK : 0n;
}

async function updateCursor(contractAddress: Address, eventGroup: string, lastBlock: bigint) {
  await prisma.indexerCursor.upsert({
    where: {
      chainId_contractAddress_eventGroup: {
        chainId,
        contractAddress: contractAddress.toLowerCase(),
        eventGroup,
      },
    },
    update: { lastBlock },
    create: {
      chainId,
      contractAddress: contractAddress.toLowerCase(),
      eventGroup,
      lastBlock,
    },
  });
}

async function processLogs(logs: IndexedLog[], contractAddress: Address, eventGroup: string) {
  let latestBlock: bigint | undefined;
  for (const log of logs.sort((left, right) => Number(left.blockNumber - right.blockNumber))) {
    await writeWithRetry(log, contractAddress);
    latestBlock = log.blockNumber;
  }

  if (latestBlock !== undefined) {
    await updateCursor(contractAddress, eventGroup, latestBlock);
  }
}

function normalizeLogs(
  logs: Array<{
    transactionHash: Hash;
    blockNumber: bigint | null;
    logIndex: number;
    eventName?: string | undefined;
    args?: Record<string, unknown> | undefined;
  }>,
): IndexedLog[] {
  return logs.flatMap((log) =>
    log.blockNumber === null || log.eventName === undefined || log.args === undefined
      ? []
      : [
          {
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
            logIndex: log.logIndex,
            eventName: log.eventName,
            args: log.args,
          },
        ],
  );
}

async function backfillRouter(routerAddress: Address) {
  const currentBlock = await client.getBlockNumber();
  const fromBlock = await getCursor(routerAddress, "router", currentBlock);
  const logs = await client.getLogs({
    address: routerAddress,
    events: routerEventAbi,
    fromBlock,
    toBlock: currentBlock,
  });
  await processLogs(normalizeLogs(logs), routerAddress, "router");
}

async function backfillStaking(stakingAddress: Address) {
  const currentBlock = await client.getBlockNumber();
  const fromBlock = await getCursor(stakingAddress, "staking", currentBlock);
  const logs = await client.getLogs({
    address: stakingAddress,
    events: stakingEventAbi,
    fromBlock,
    toBlock: currentBlock,
  });
  await processLogs(normalizeLogs(logs), stakingAddress, "staking");
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
      void processLogs(normalizeLogs(logs), routerAddress, "router").catch((error: unknown) =>
        console.error("[indexer] router event write failed", error),
      );
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
      void processLogs(normalizeLogs(logs), stakingAddress, "staking").catch((error: unknown) =>
        console.error("[indexer] staking event write failed", error),
      );
    },
    onError: (error) => console.error("[indexer] staking watcher failed", error),
  });
}

async function backfill() {
  if (addresses.demoSwapRouter !== undefined) {
    await backfillRouter(addresses.demoSwapRouter);
  }
  if (addresses.demoStaking !== undefined) {
    await backfillStaking(addresses.demoStaking);
  }
}

await backfill();
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
