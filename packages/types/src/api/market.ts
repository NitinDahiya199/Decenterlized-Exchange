import { z } from "zod";

export const marketSlugParamsSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(32)
    .regex(/^[a-z0-9]+-[a-z0-9]+$/i)
    .transform((slug) => slug.toUpperCase()),
});

export type MarketSlugParams = z.infer<typeof marketSlugParamsSchema>;

export const candleIntervalSchema = z.enum(["M1", "M5", "M15", "H1", "H4", "D1", "W1"]);

export type CandleInterval = z.infer<typeof candleIntervalSchema>;

export const candlesQuerySchema = z.object({
  interval: candleIntervalSchema.default("H1"),
  limit: z.coerce.number().int().positive().max(500).default(100),
});

export type CandlesQuery = z.infer<typeof candlesQuerySchema>;

export const recentTradesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type RecentTradesQuery = z.infer<typeof recentTradesQuerySchema>;

const decimalStringSchema = z
  .string()
  .trim()
  .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/);

const positiveDecimalStringSchema = decimalStringSchema.refine((value) => Number(value) > 0, {
  message: "Must be greater than 0",
});

export const orderSideSchema = z.enum(["BUY", "SELL"]);

export type OrderSide = z.infer<typeof orderSideSchema>;

export const orderTypeSchema = z.enum(["LIMIT", "MARKET"]);

export type OrderType = z.infer<typeof orderTypeSchema>;

export const orderStatusSchema = z.enum([
  "OPEN",
  "PARTIALLY_FILLED",
  "FILLED",
  "CANCELLED",
  "REJECTED",
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const createOrderBodySchema = z
  .object({
    slug: marketSlugParamsSchema.shape.slug,
    side: orderSideSchema,
    type: orderTypeSchema,
    price: positiveDecimalStringSchema.optional(),
    quantity: positiveDecimalStringSchema,
    walletAddress: z.string().trim().min(1).max(128).optional(),
  })
  .superRefine((body, context) => {
    if (body.type === "LIMIT" && body.price === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Limit orders require a price",
        path: ["price"],
      });
    }
  });

export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;

export const orderIdParamsSchema = z.object({
  id: z.string().min(1),
});

export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;

export const linkWalletBodySchema = z.object({
  address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .transform((address) => address.toLowerCase()),
  chainId: z.coerce.number().int().positive(),
});

export type LinkWalletBody = z.infer<typeof linkWalletBodySchema>;

export const linkedWalletResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    displayName: z.string().nullable(),
  }),
  wallet: z.object({
    id: z.string(),
    address: z.string(),
    chainId: z.number().int(),
    isPrimary: z.boolean(),
  }),
});

export type LinkedWalletResponse = z.infer<typeof linkedWalletResponseSchema>;

export const walletAddressParamsSchema = z.object({
  address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .transform((address) => address.toLowerCase()),
});

export type WalletAddressParams = z.infer<typeof walletAddressParamsSchema>;

export const walletBalancesQuerySchema = z.object({
  chainId: z.coerce.number().int().positive().optional(),
});

export type WalletBalancesQuery = z.infer<typeof walletBalancesQuerySchema>;

export const tokenSummarySchema = z.object({
  symbol: z.string(),
  name: z.string(),
  decimals: z.number().int(),
  chainId: z.number().int(),
  isNative: z.boolean(),
});

export type TokenSummary = z.infer<typeof tokenSummarySchema>;

export const balanceRowSchema = z.object({
  id: z.string(),
  token: tokenSummarySchema,
  wallet: z.object({
    address: z.string(),
    chainId: z.number().int(),
  }),
  available: z.string(),
  locked: z.string(),
  total: z.string(),
  simulated: z.boolean(),
  updatedAt: z.string(),
});

export type BalanceRow = z.infer<typeof balanceRowSchema>;

export const balancesResponseSchema = z.object({
  balances: z.array(balanceRowSchema),
});

export type BalancesResponse = z.infer<typeof balancesResponseSchema>;

export const pairSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  baseToken: tokenSummarySchema,
  quoteToken: tokenSummarySchema,
});

export type PairSummary = z.infer<typeof pairSummarySchema>;

export const pairsResponseSchema = z.object({
  pairs: z.array(pairSummarySchema),
});

export type PairsResponse = z.infer<typeof pairsResponseSchema>;

export const orderbookLevelSchema = z.object({
  price: z.string(),
  quantity: z.string(),
});

export type OrderbookLevel = z.infer<typeof orderbookLevelSchema>;

export const orderbookResponseSchema = z.object({
  slug: z.string(),
  bids: z.array(orderbookLevelSchema),
  asks: z.array(orderbookLevelSchema),
});

export type OrderbookResponse = z.infer<typeof orderbookResponseSchema>;

export const marketTickerSchema = z.object({
  slug: z.string(),
  lastPrice: z.string(),
  bid: z.string().nullable(),
  ask: z.string().nullable(),
  updatedAt: z.string(),
});

export type MarketTicker = z.infer<typeof marketTickerSchema>;

export const marketOrderbookDeltaSchema = orderbookResponseSchema.extend({
  updatedAt: z.string(),
});

export type MarketOrderbookDelta = z.infer<typeof marketOrderbookDeltaSchema>;

export function marketTickerEventName(slug: string): `pair:${string}:ticker` {
  return `pair:${slug.toUpperCase()}:ticker`;
}

export function marketOrderbookEventName(slug: string): `pair:${string}:orderbook:delta` {
  return `pair:${slug.toUpperCase()}:orderbook:delta`;
}

export const tradeSchema = z.object({
  id: z.string(),
  side: z.enum(["BUY", "SELL"]),
  price: z.string(),
  quantity: z.string(),
  executedAt: z.string(),
});

export type Trade = z.infer<typeof tradeSchema>;

export const tradesResponseSchema = z.object({
  slug: z.string(),
  trades: z.array(tradeSchema),
});

export type TradesResponse = z.infer<typeof tradesResponseSchema>;

export const orderSchema = z.object({
  id: z.string(),
  slug: z.string(),
  side: orderSideSchema,
  type: orderTypeSchema,
  status: orderStatusSchema,
  price: z.string().nullable(),
  quantity: z.string(),
  filledQuantity: z.string(),
  walletAddress: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Order = z.infer<typeof orderSchema>;

export const orderMutationResponseSchema = z.object({
  order: orderSchema,
  trades: z.array(tradeSchema),
});

export type OrderMutationResponse = z.infer<typeof orderMutationResponseSchema>;

export const candleSchema = z.object({
  interval: candleIntervalSchema,
  bucket: z.string(),
  open: z.string(),
  high: z.string(),
  low: z.string(),
  close: z.string(),
  volume: z.string(),
});

export type Candle = z.infer<typeof candleSchema>;

export const candlesResponseSchema = z.object({
  slug: z.string(),
  interval: candleIntervalSchema,
  candles: z.array(candleSchema),
});

export type CandlesResponse = z.infer<typeof candlesResponseSchema>;
