import { Prisma } from "@prisma/client";
import type { CreateOrderBody } from "@dex-terminal/types";
import { prisma } from "./prisma.js";

const SIMULATOR_EMAIL = "demo@example.local";
const SIMULATOR_WALLET = "0x000000000000000000000000000000000000dEaD";

const pairInclude = {
  baseToken: true,
  quoteToken: true,
} satisfies Prisma.PairInclude;

type PairWithTokens = Prisma.PairGetPayload<{ include: typeof pairInclude }>;
type TransactionClient = Prisma.TransactionClient;
type MatchOrder = Prisma.OrderGetPayload<{ include: { pair: true } }>;

export type SimulatorOrderResult = {
  order: MatchOrder;
  trades: Prisma.TradeGetPayload<object>[];
};

export type OrderActor = {
  userId: string;
  walletId: string;
  walletAddress: string;
};

function minDecimal(left: Prisma.Decimal, right: Prisma.Decimal): Prisma.Decimal {
  return left.lessThan(right) ? left : right;
}

function remainingQuantity(order: {
  quantity: Prisma.Decimal;
  filledQuantity: Prisma.Decimal;
}): Prisma.Decimal {
  return order.quantity.minus(order.filledQuantity);
}

function nextStatus(quantity: Prisma.Decimal, filledQuantity: Prisma.Decimal) {
  if (filledQuantity.greaterThanOrEqualTo(quantity)) {
    return "FILLED";
  }

  return filledQuantity.greaterThan(0) ? "PARTIALLY_FILLED" : "OPEN";
}

async function getOrCreateWallet(tx: TransactionClient, userId: string, chainId: number) {
  const wallet = await tx.wallet.findFirst({
    where: { userId, chainId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });

  if (wallet !== null) {
    return wallet;
  }

  return tx.wallet.create({
    data: {
      userId,
      address: SIMULATOR_WALLET,
      chainId,
      isPrimary: true,
      label: "Demo",
    },
  });
}

async function ensureBalance(
  tx: TransactionClient,
  {
    userId,
    walletId,
    tokenId,
    initialAvailable,
  }: {
    userId: string;
    walletId: string;
    tokenId: string;
    initialAvailable: string;
  },
) {
  await tx.balance.upsert({
    where: {
      userId_tokenId_walletId: {
        userId,
        tokenId,
        walletId,
      },
    },
    create: {
      userId,
      tokenId,
      walletId,
      available: initialAvailable,
      simulated: true,
    },
    update: {},
  });
}

async function getOrCreateSimulatorAccount(tx: TransactionClient, pair: PairWithTokens) {
  const user =
    (await tx.user.findUnique({
      where: { email: SIMULATOR_EMAIL },
    })) ??
    (await tx.user.create({
      data: {
        displayName: "Demo Trader",
        email: SIMULATOR_EMAIL,
      },
    }));

  const wallet = await getOrCreateWallet(tx, user.id, pair.baseToken.chainId);

  await ensureBalance(tx, {
    userId: user.id,
    walletId: wallet.id,
    tokenId: pair.baseTokenId,
    initialAvailable: "100",
  });
  await ensureBalance(tx, {
    userId: user.id,
    walletId: wallet.id,
    tokenId: pair.quoteTokenId,
    initialAvailable: "200000",
  });

  return { user, wallet };
}

async function adjustBalance(
  tx: TransactionClient,
  {
    userId,
    tokenId,
    chainId,
    delta,
  }: {
    userId: string;
    tokenId: string;
    chainId: number;
    delta: Prisma.Decimal;
  },
) {
  const wallet = await getOrCreateWallet(tx, userId, chainId);

  await ensureBalance(tx, {
    userId,
    walletId: wallet.id,
    tokenId,
    initialAvailable: "0",
  });

  await tx.balance.update({
    where: {
      userId_tokenId_walletId: {
        userId,
        tokenId,
        walletId: wallet.id,
      },
    },
    data: {
      available: { increment: delta },
      simulated: true,
    },
  });
}

async function applyTradeBalances(
  tx: TransactionClient,
  {
    pair,
    buyerUserId,
    sellerUserId,
    quantity,
    price,
  }: {
    pair: PairWithTokens;
    buyerUserId: string;
    sellerUserId: string;
    quantity: Prisma.Decimal;
    price: Prisma.Decimal;
  },
) {
  const notional = price.mul(quantity);

  await adjustBalance(tx, {
    userId: buyerUserId,
    tokenId: pair.baseTokenId,
    chainId: pair.baseToken.chainId,
    delta: quantity,
  });
  await adjustBalance(tx, {
    userId: buyerUserId,
    tokenId: pair.quoteTokenId,
    chainId: pair.quoteToken.chainId,
    delta: notional.neg(),
  });
  await adjustBalance(tx, {
    userId: sellerUserId,
    tokenId: pair.baseTokenId,
    chainId: pair.baseToken.chainId,
    delta: quantity.neg(),
  });
  await adjustBalance(tx, {
    userId: sellerUserId,
    tokenId: pair.quoteTokenId,
    chainId: pair.quoteToken.chainId,
    delta: notional,
  });
}

async function matchOrder(
  tx: TransactionClient,
  order: MatchOrder,
  pair: PairWithTokens,
): Promise<SimulatorOrderResult> {
  const trades: Prisma.TradeGetPayload<object>[] = [];
  let filledQuantity = order.filledQuantity;

  while (remainingQuantity({ quantity: order.quantity, filledQuantity }).greaterThan(0)) {
    const limitPrice = order.price;
    let priceFilter: Prisma.DecimalNullableFilter<"Order">;

    if (order.type === "MARKET") {
      priceFilter = { not: null };
    } else {
      if (limitPrice === null) {
        break;
      }

      priceFilter = order.side === "BUY" ? { lte: limitPrice, not: null } : { gte: limitPrice, not: null };
    }
    const remaining = remainingQuantity({ quantity: order.quantity, filledQuantity });
    const maker = await tx.order.findFirst({
      where: {
        id: { not: order.id },
        pairId: order.pairId,
        side: order.side === "BUY" ? "SELL" : "BUY",
        status: { in: ["OPEN", "PARTIALLY_FILLED"] },
        type: "LIMIT",
        price: priceFilter,
      },
      orderBy:
        order.side === "BUY"
          ? [{ price: "asc" }, { createdAt: "asc" }]
          : [{ price: "desc" }, { createdAt: "asc" }],
    });

    if (maker === null || maker.price === null) {
      break;
    }

    const makerRemaining = remainingQuantity(maker);
    const fillQuantity = minDecimal(remaining, makerRemaining);
    const nextMakerFilled = maker.filledQuantity.plus(fillQuantity);
    const nextTakerFilled = filledQuantity.plus(fillQuantity);
    const trade = await tx.trade.create({
      data: {
        pairId: order.pairId,
        makerOrderId: maker.id,
        takerOrderId: order.id,
        side: order.side,
        price: maker.price,
        quantity: fillQuantity,
      },
    });

    await tx.order.update({
      where: { id: maker.id },
      data: {
        filledQuantity: nextMakerFilled,
        status: nextStatus(maker.quantity, nextMakerFilled),
      },
    });

    await applyTradeBalances(tx, {
      pair,
      buyerUserId: order.side === "BUY" ? order.userId : maker.userId,
      sellerUserId: order.side === "SELL" ? order.userId : maker.userId,
      quantity: fillQuantity,
      price: maker.price,
    });

    trades.push(trade);
    filledQuantity = nextTakerFilled;
  }

  const finalStatus =
    order.type === "MARKET" && filledQuantity.lessThan(order.quantity)
      ? filledQuantity.greaterThan(0)
        ? "CANCELLED"
        : "REJECTED"
      : nextStatus(order.quantity, filledQuantity);

  const updatedOrder = await tx.order.update({
    where: { id: order.id },
    data: {
      filledQuantity,
      status: finalStatus,
    },
    include: { pair: true },
  });

  return { order: updatedOrder, trades };
}

export async function createAndMatchOrder(
  body: CreateOrderBody,
  actor?: OrderActor,
): Promise<SimulatorOrderResult> {
  return prisma.$transaction(
    async (tx) => {
      const pair = await tx.pair.findUnique({
        where: { slug: body.slug },
        include: pairInclude,
      });

      if (pair === null) {
        throw new Error("PAIR_NOT_FOUND");
      }

      const account = actor ?? (await getOrCreateSimulatorAccount(tx, pair));
      const userId = "user" in account ? account.user.id : account.userId;
      const walletId = "wallet" in account ? account.wallet.id : account.walletId;
      const walletAddress = "wallet" in account ? account.wallet.address : account.walletAddress;
      await ensureBalance(tx, {
        userId,
        walletId,
        tokenId: pair.baseTokenId,
        initialAvailable: "100",
      });
      await ensureBalance(tx, {
        userId,
        walletId,
        tokenId: pair.quoteTokenId,
        initialAvailable: "200000",
      });
      const orderData: Prisma.OrderUncheckedCreateInput = {
        userId,
        pairId: pair.id,
        side: body.side,
        type: body.type,
        price: body.type === "LIMIT" ? body.price ?? null : null,
        quantity: body.quantity,
        walletAddress,
      };
      const order: MatchOrder = await tx.order.create({
        data: orderData,
        include: { pair: true },
      });

      return matchOrder(tx, order, pair);
    },
    { timeout: 20_000 },
  );
}
