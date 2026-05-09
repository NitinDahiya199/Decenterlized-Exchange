import { describe, expect, it } from "vitest";
import { buildEventKey, stringifyBigInts } from "./event-utils.js";

describe("indexer event utils", () => {
  it("builds an idempotent event key from transaction hash and log index", () => {
    expect(buildEventKey("0xabc123" as `0x${string}`, 7)).toBe("0xabc123:7");
  });

  it("serializes bigint values for Prisma JSON metadata", () => {
    expect(
      stringifyBigInts({
        blockNumber: 123n,
        nested: {
          amount: 456n,
        },
      }),
    ).toEqual({
      blockNumber: "123",
      nested: {
        amount: "456",
      },
    });
  });
});
