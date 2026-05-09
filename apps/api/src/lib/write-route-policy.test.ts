import { describe, expect, it } from "vitest";
import {
  buildRateLimitError,
  requireMatchingWallet,
  requireOrderOwner,
  requireVerifiedSession,
  type WriteRouteSession,
} from "./write-route-policy.js";

const verifiedSession: Exclude<WriteRouteSession, null> = {
  userId: "user_1",
  address: "0x1111111111111111111111111111111111111111",
  verified: true,
};

describe("write route policy", () => {
  it("rejects missing sessions", () => {
    const result = requireVerifiedSession(null);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.body.code).toBe("UNAUTHORIZED");
    }
  });

  it("rejects unverified wallet sessions", () => {
    const result = requireVerifiedSession({ ...verifiedSession, verified: false });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.body.message).toContain("Verified");
    }
  });

  it("rejects wallet addresses that do not match the session", () => {
    const result = requireMatchingWallet(verifiedSession, "0x2222222222222222222222222222222222222222");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.body.code).toBe("FORBIDDEN");
    }
  });

  it("allows wallet addresses that match the session", () => {
    expect(requireMatchingWallet(verifiedSession, verifiedSession.address).ok).toBe(true);
    expect(requireMatchingWallet(verifiedSession, undefined).ok).toBe(true);
  });

  it("rejects cancellation by a different user", () => {
    const result = requireOrderOwner(verifiedSession, "user_2");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.body.message).toContain("own");
    }
  });

  it("builds shared rate-limit errors", () => {
    const body = buildRateLimitError(10, "1 minute");

    expect(body).toEqual({
      code: "RATE_LIMITED",
      message: "Too many write requests",
      details: {
        max: 10,
        after: "1 minute",
      },
    });
  });
});
