import Fastify from "fastify";
import cors from "@fastify/cors";
import { Prisma } from "@prisma/client";
import { Server } from "socket.io";
import {
  ApiErrorCodes,
  apiError,
  balancesResponseSchema,
  candlesQuerySchema,
  createOrderBodySchema,
  linkWalletBodySchema,
  marketOrderbookEventName,
  marketSlugParamsSchema,
  marketTickerEventName,
  orderIdParamsSchema,
  parseServerEnv,
  recentTradesQuerySchema,
  TYPES_PACKAGE,
  walletAddressParamsSchema,
  walletBalancesQuerySchema,
  type MarketOrderbookDelta,
  type MarketTicker,
  type OrderbookLevel,
  type OrderbookResponse,
} from "@dex-terminal/types";
import type { FastifyReply } from "fastify";
import { createAndMatchOrder } from "./lib/matcher.js";
import { prisma } from "./lib/prisma.js";
import {
  createSessionToken,
  getSessionTokenFromCookie,
  sessionCookieHeader,
  verifySessionToken,
} from "./lib/session.js";

const env = parseServerEnv(process.env);
const host = env.API_HOST;
const port = env.API_PORT;
const defaultMarketSlug = "ETH-USDC";

const fastify = Fastify({ logger: true });
const marketTimerRef: { current?: ReturnType<typeof setInterval> } = {};

const pairInclude = {
  baseToken: true,
  quoteToken: true,
} satisfies Prisma.PairInclude;

await fastify.register(cors, {
  origin: env.API_ORIGIN ?? "http://localhost:3000",
  credentials: true,
});

type PairWithTokens = Prisma.PairGetPayload<{ include: typeof pairInclude }>;

type ValidationError = {
  flatten: () => unknown;
};

function serializePair(pair: PairWithTokens) {
  return {
    id: pair.id,
    slug: pair.slug,
    baseToken: {
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name,
      decimals: pair.baseToken.decimals,
      chainId: pair.baseToken.chainId,
      isNative: pair.baseToken.isNative,
    },
    quoteToken: {
      symbol: pair.quoteToken.symbol,
      name: pair.quoteToken.name,
      decimals: pair.quoteToken.decimals,
      chainId: pair.quoteToken.chainId,
      isNative: pair.quoteToken.isNative,
    },
  };
}

function sendValidationError(reply: FastifyReply, message: string, error: ValidationError) {
  return reply.status(400).send(
    apiError(ApiErrorCodes.BAD_REQUEST, message, {
      validation: error.flatten(),
    }),
  );
}

function sendPairNotFound(reply: FastifyReply, slug: string) {
  return reply.status(404).send(
    apiError(ApiErrorCodes.NOT_FOUND, "Pair not found", {
      slug,
    }),
  );
}

function sendOrderNotFound(reply: FastifyReply, id: string) {
  return reply.status(404).send(
    apiError(ApiErrorCodes.NOT_FOUND, "Order not found", {
      id,
    }),
  );
}

function sendUnauthorized(reply: FastifyReply) {
  return reply.status(401).send(apiError(ApiErrorCodes.UNAUTHORIZED, "Wallet session required"));
}

async function findPairBySlug(slug: string) {
  return prisma.pair.findUnique({
    where: { slug },
    include: pairInclude,
  });
}

function serializeTrade(trade: {
  id: string;
  side: "BUY" | "SELL";
  price: Prisma.Decimal;
  quantity: Prisma.Decimal;
  executedAt: Date;
}) {
  return {
    id: trade.id,
    side: trade.side,
    price: trade.price.toString(),
    quantity: trade.quantity.toString(),
    executedAt: trade.executedAt.toISOString(),
  };
}

function serializeOrder(order: {
  id: string;
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET";
  status: "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED" | "REJECTED";
  price: Prisma.Decimal | null;
  quantity: Prisma.Decimal;
  filledQuantity: Prisma.Decimal;
  walletAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
  pair: { slug: string };
}) {
  return {
    id: order.id,
    slug: order.pair.slug,
    side: order.side,
    type: order.type,
    status: order.status,
    price: order.price?.toString() ?? null,
    quantity: order.quantity.toString(),
    filledQuantity: order.filledQuantity.toString(),
    walletAddress: order.walletAddress,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function serializeBalance(balance: {
  id: string;
  available: Prisma.Decimal;
  locked: Prisma.Decimal;
  simulated: boolean;
  updatedAt: Date;
  token: {
    symbol: string;
    name: string;
    decimals: number;
    chainId: number;
    isNative: boolean;
  };
  wallet: {
    address: string;
    chainId: number;
  };
}) {
  const total = balance.available.plus(balance.locked);

  return {
    id: balance.id,
    token: {
      symbol: balance.token.symbol,
      name: balance.token.name,
      decimals: balance.token.decimals,
      chainId: balance.token.chainId,
      isNative: balance.token.isNative,
    },
    wallet: {
      address: balance.wallet.address,
      chainId: balance.wallet.chainId,
    },
    available: balance.available.toString(),
    locked: balance.locked.toString(),
    total: total.toString(),
    simulated: balance.simulated,
    updatedAt: balance.updatedAt.toISOString(),
  };
}

async function getBalances(where: Prisma.BalanceWhereInput) {
  const balances = await prisma.balance.findMany({
    where,
    include: {
      token: true,
      wallet: {
        select: {
          address: true,
          chainId: true,
        },
      },
    },
    orderBy: [{ token: { symbol: "asc" } }],
  });

  return balancesResponseSchema.parse({
    balances: balances.map(serializeBalance),
  });
}

function toOrderbookLevels(
  orders: Array<{
    price: Prisma.Decimal | null;
    quantity: Prisma.Decimal;
    filledQuantity: Prisma.Decimal;
  }>,
  sortDirection: "asc" | "desc",
): OrderbookLevel[] {
  const totals = new Map<string, Prisma.Decimal>();

  for (const order of orders) {
    if (order.price === null) {
      continue;
    }

    const remaining = order.quantity.minus(order.filledQuantity);
    if (remaining.lte(0)) {
      continue;
    }

    const price = order.price.toString();
    totals.set(price, (totals.get(price) ?? new Prisma.Decimal(0)).plus(remaining));
  }

  return [...totals.entries()]
    .map(([price, quantity]) => ({ price, quantity: quantity.toString() }))
    .sort((left, right) =>
      sortDirection === "asc"
        ? Number(left.price) - Number(right.price)
        : Number(right.price) - Number(left.price),
    )
    .slice(0, 20);
}

async function getOrderbook(slug: string): Promise<OrderbookResponse | null> {
  const pair = await findPairBySlug(slug);
  if (pair === null) {
    return null;
  }

  const orders = await prisma.order.findMany({
    where: {
      pairId: pair.id,
      status: { in: ["OPEN", "PARTIALLY_FILLED"] },
      type: "LIMIT",
      price: { not: null },
    },
    select: {
      side: true,
      price: true,
      quantity: true,
      filledQuantity: true,
    },
    orderBy: [{ createdAt: "asc" }],
    take: 200,
  });

  return {
    slug: pair.slug,
    bids: toOrderbookLevels(
      orders.filter((order) => order.side === "BUY"),
      "desc",
    ),
    asks: toOrderbookLevels(
      orders.filter((order) => order.side === "SELL"),
      "asc",
    ),
  };
}

async function getTicker(slug: string, orderbook: OrderbookResponse): Promise<MarketTicker | null> {
  const pair = await prisma.pair.findUnique({
    where: { slug },
    select: { id: true, slug: true },
  });

  if (pair === null) {
    return null;
  }

  const latestTrade = await prisma.trade.findFirst({
    where: { pairId: pair.id },
    orderBy: { executedAt: "desc" },
    select: { price: true, executedAt: true },
  });

  const latestCandle = await prisma.candle.findFirst({
    where: { pairId: pair.id },
    orderBy: { bucket: "desc" },
    select: { close: true, bucket: true },
  });

  return {
    slug: pair.slug,
    lastPrice: (latestTrade?.price ?? latestCandle?.close ?? new Prisma.Decimal(0)).toString(),
    bid: orderbook.bids[0]?.price ?? null,
    ask: orderbook.asks[0]?.price ?? null,
    updatedAt: (latestTrade?.executedAt ?? latestCandle?.bucket ?? new Date()).toISOString(),
  };
}

await fastify.get("/health", async () => ({
  ok: true,
  types: TYPES_PACKAGE,
}));

await fastify.get("/pairs", async () => {
  const pairs = await prisma.pair.findMany({
    include: pairInclude,
    orderBy: { slug: "asc" },
  });

  return { pairs: pairs.map(serializePair) };
});

await fastify.get("/pairs/:slug/orderbook", async (request, reply) => {
  const paramsResult = marketSlugParamsSchema.safeParse(request.params);
  if (!paramsResult.success) {
    return sendValidationError(reply, "Invalid pair slug", paramsResult.error);
  }

  const { slug } = paramsResult.data;
  const orderbook = await getOrderbook(slug);
  if (orderbook === null) {
    return sendPairNotFound(reply, slug);
  }

  return orderbook;
});

await fastify.get("/pairs/:slug/trades", async (request, reply) => {
  const paramsResult = marketSlugParamsSchema.safeParse(request.params);
  if (!paramsResult.success) {
    return sendValidationError(reply, "Invalid pair slug", paramsResult.error);
  }

  const queryResult = recentTradesQuerySchema.safeParse(request.query);
  if (!queryResult.success) {
    return sendValidationError(reply, "Invalid trades query", queryResult.error);
  }

  const { slug } = paramsResult.data;
  const pair = await findPairBySlug(slug);
  if (pair === null) {
    return sendPairNotFound(reply, slug);
  }

  const trades = await prisma.trade.findMany({
    where: { pairId: pair.id },
    orderBy: { executedAt: "desc" },
    take: queryResult.data.limit,
  });

  return {
    slug: pair.slug,
    trades: trades.map(serializeTrade),
  };
});

await fastify.get("/pairs/:slug/candles", async (request, reply) => {
  const paramsResult = marketSlugParamsSchema.safeParse(request.params);
  if (!paramsResult.success) {
    return sendValidationError(reply, "Invalid pair slug", paramsResult.error);
  }

  const queryResult = candlesQuerySchema.safeParse(request.query);
  if (!queryResult.success) {
    return sendValidationError(reply, "Invalid candles query", queryResult.error);
  }

  const { slug } = paramsResult.data;
  const pair = await findPairBySlug(slug);
  if (pair === null) {
    return sendPairNotFound(reply, slug);
  }

  const candles = await prisma.candle.findMany({
    where: {
      pairId: pair.id,
      interval: queryResult.data.interval,
    },
    orderBy: { bucket: "asc" },
    take: queryResult.data.limit,
  });

  return {
    slug: pair.slug,
    interval: queryResult.data.interval,
    candles: candles.map((candle) => ({
      interval: candle.interval,
      bucket: candle.bucket.toISOString(),
      open: candle.open.toString(),
      high: candle.high.toString(),
      low: candle.low.toString(),
      close: candle.close.toString(),
      volume: candle.volume.toString(),
    })),
  };
});

await fastify.get("/user/balances", async (request, reply) => {
  const token = getSessionTokenFromCookie(request.headers.cookie);
  if (token === null) {
    return sendUnauthorized(reply);
  }

  const session = verifySessionToken(token, env.SESSION_SECRET);
  if (session === null) {
    return sendUnauthorized(reply);
  }

  return getBalances({
    userId: session.userId,
    walletId: session.walletId,
  });
});

await fastify.get("/wallets/:address/balances", async (request, reply) => {
  const paramsResult = walletAddressParamsSchema.safeParse(request.params);
  if (!paramsResult.success) {
    return sendValidationError(reply, "Invalid wallet address", paramsResult.error);
  }

  const queryResult = walletBalancesQuerySchema.safeParse(request.query);
  if (!queryResult.success) {
    return sendValidationError(reply, "Invalid balances query", queryResult.error);
  }

  return getBalances({
    wallet: {
      address: paramsResult.data.address,
      ...(queryResult.data.chainId !== undefined ? { chainId: queryResult.data.chainId } : {}),
    },
  });
});

await fastify.post("/orders", async (request, reply) => {
  const bodyResult = createOrderBodySchema.safeParse(request.body);
  if (!bodyResult.success) {
    return sendValidationError(reply, "Invalid order body", bodyResult.error);
  }

  try {
    const result = await createAndMatchOrder(bodyResult.data);
    void emitMarketSnapshot(result.order.pair.slug);

    return reply.status(201).send({
      order: serializeOrder(result.order),
      trades: result.trades.map(serializeTrade),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PAIR_NOT_FOUND") {
      return sendPairNotFound(reply, bodyResult.data.slug);
    }

    throw error;
  }
});

await fastify.post("/wallets/link", async (request, reply) => {
  const bodyResult = linkWalletBodySchema.safeParse(request.body);
  if (!bodyResult.success) {
    return sendValidationError(reply, "Invalid wallet link body", bodyResult.error);
  }

  const { address, chainId } = bodyResult.data;
  const linkedWallet = await prisma.$transaction(async (tx) => {
    const existingWallet = await tx.wallet.findUnique({
      where: {
        address_chainId: {
          address,
          chainId,
        },
      },
      include: { user: true },
    });

    if (existingWallet !== null) {
      return existingWallet;
    }

    const user = await tx.user.create({
      data: {
        displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
      },
    });

    return tx.wallet.create({
      data: {
        userId: user.id,
        address,
        chainId,
        isPrimary: true,
        label: "Connected wallet",
      },
      include: { user: true },
    });
  });

  const token = createSessionToken(
    {
      userId: linkedWallet.userId,
      walletId: linkedWallet.id,
      address: linkedWallet.address,
      chainId: linkedWallet.chainId,
    },
    env.SESSION_SECRET,
  );

  reply.header(
    "set-cookie",
    sessionCookieHeader({
      token,
      secure: env.NODE_ENV === "production",
    }),
  );

  return {
    user: {
      id: linkedWallet.user.id,
      displayName: linkedWallet.user.displayName,
    },
    wallet: {
      id: linkedWallet.id,
      address: linkedWallet.address,
      chainId: linkedWallet.chainId,
      isPrimary: linkedWallet.isPrimary,
    },
  };
});

await fastify.delete("/orders/:id", async (request, reply) => {
  const paramsResult = orderIdParamsSchema.safeParse(request.params);
  if (!paramsResult.success) {
    return sendValidationError(reply, "Invalid order id", paramsResult.error);
  }

  const { id } = paramsResult.data;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { pair: true },
  });

  if (order === null) {
    return sendOrderNotFound(reply, id);
  }

  if (order.status !== "OPEN" && order.status !== "PARTIALLY_FILLED") {
    return reply.status(409).send(
      apiError(ApiErrorCodes.CONFLICT, "Only open orders can be cancelled", {
        id,
        status: order.status,
      }),
    );
  }

  const cancelledOrder = await prisma.order.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: { pair: true },
  });

  void emitMarketSnapshot(cancelledOrder.pair.slug);

  return {
    order: serializeOrder(cancelledOrder),
    trades: [],
  };
});

fastify.setNotFoundHandler((_request, reply) =>
  reply.status(404).send(apiError(ApiErrorCodes.NOT_FOUND, "Route not found")),
);

fastify.addHook("onClose", async () => {
  if (marketTimerRef.current !== undefined) {
    clearInterval(marketTimerRef.current);
  }
});

await fastify.ready();

const io = new Server(fastify.server, {
  cors: { origin: env.API_ORIGIN ?? "http://localhost:3000" },
});

async function emitMarketSnapshot(slug: string): Promise<void> {
  const orderbook = await getOrderbook(slug);
  if (orderbook === null) {
    fastify.log.warn({ slug }, "market snapshot skipped; pair not found");
    return;
  }

  const updatedAt = new Date().toISOString();
  const orderbookDelta: MarketOrderbookDelta = {
    ...orderbook,
    updatedAt,
  };
  const ticker = await getTicker(slug, orderbook);

  io.emit(marketOrderbookEventName(slug), orderbookDelta);
  if (ticker !== null) {
    io.emit(marketTickerEventName(slug), {
      ...ticker,
      updatedAt,
    });
  }
}

io.on("connection", (socket) => {
  fastify.log.info({ id: socket.id }, "socket connected");
  socket.emit("welcome", { message: "DEX Terminal API (dev)" });
  void emitMarketSnapshot(defaultMarketSlug);
});

marketTimerRef.current = setInterval(() => {
  void emitMarketSnapshot(defaultMarketSlug).catch((error: unknown) => {
    fastify.log.error({ error }, "market snapshot emit failed");
  });
}, 5_000);

await fastify.listen({ port, host });
