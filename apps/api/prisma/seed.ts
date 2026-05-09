import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      displayName: "Demo Trader",
      email: "demo@example.local",
    },
  });

  const wallet = await prisma.wallet.create({
    data: {
      userId: user.id,
      address: "0x000000000000000000000000000000000000dEaD",
      chainId: 11155111,
      isPrimary: true,
      label: "Demo",
    },
  });

  const base = await prisma.token.create({
    data: {
      symbol: "ETH",
      name: "Ether (simulated)",
      decimals: 18,
      chainId: 11155111,
      isNative: true,
    },
  });

  const quote = await prisma.token.create({
    data: {
      symbol: "USDC",
      name: "USD Coin (simulated)",
      decimals: 6,
      chainId: 11155111,
      isNative: false,
    },
  });

  const pair = await prisma.pair.create({
    data: {
      baseTokenId: base.id,
      quoteTokenId: quote.id,
      slug: "ETH-USDC",
    },
  });

  await prisma.liquidityPool.create({
    data: {
      pairId: pair.id,
      feeBps: 30,
      reserve0: "100",
      reserve1: "200000",
    },
  });

  await prisma.balance.createMany({
    data: [
      {
        userId: user.id,
        tokenId: base.id,
        walletId: wallet.id,
        available: "50",
        simulated: true,
      },
      {
        userId: user.id,
        tokenId: quote.id,
        walletId: wallet.id,
        available: "100000",
        simulated: true,
      },
    ],
  });

  const watchlist = await prisma.watchlist.create({
    data: {
      userId: user.id,
      name: "Default",
    },
  });

  await prisma.watchlistItem.create({
    data: { watchlistId: watchlist.id, pairId: pair.id, sortOrder: 0 },
  });

  await prisma.candle.create({
    data: {
      pairId: pair.id,
      interval: "H1",
      open: "3000",
      high: "3050",
      low: "2980",
      close: "3025",
      volume: "12.5",
      bucket: new Date("2026-05-09T00:00:00.000Z"),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "SEED",
      entityType: "database",
      entityId: "seed",
      metadata: { version: 1 },
    },
  });
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
