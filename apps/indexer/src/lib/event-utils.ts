import type { Prisma } from "@prisma/client";
import type { Hash } from "viem";

export function buildEventKey(txHash: Hash, logIndex: number) {
  return `${txHash}:${logIndex}`;
}

export function stringifyBigInts(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value, (_key, item: unknown) => (typeof item === "bigint" ? item.toString() : item)),
  ) as Prisma.InputJsonValue;
}
