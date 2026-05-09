import { ApiErrorCodes, apiError } from "@dex-terminal/types";

export type WriteRouteSession = {
  userId: string;
  address: string;
  verified: boolean;
} | null;

export type PolicyResult =
  | { ok: true }
  | {
      ok: false;
      status: 401 | 403;
      body: ReturnType<typeof apiError>;
    };

export function requireVerifiedSession(session: WriteRouteSession): PolicyResult {
  if (session === null) {
    return {
      ok: false,
      status: 401,
      body: apiError(ApiErrorCodes.UNAUTHORIZED, "Wallet session required"),
    };
  }

  if (!session.verified) {
    return {
      ok: false,
      status: 401,
      body: apiError(ApiErrorCodes.UNAUTHORIZED, "Verified wallet session required"),
    };
  }

  return { ok: true };
}

export function requireMatchingWallet(session: Exclude<WriteRouteSession, null>, walletAddress: string | undefined): PolicyResult {
  if (walletAddress !== undefined && walletAddress.toLowerCase() !== session.address.toLowerCase()) {
    return {
      ok: false,
      status: 403,
      body: apiError(ApiErrorCodes.FORBIDDEN, "Order wallet does not match the active session"),
    };
  }

  return { ok: true };
}

export function requireOrderOwner(session: Exclude<WriteRouteSession, null>, orderUserId: string): PolicyResult {
  if (orderUserId !== session.userId) {
    return {
      ok: false,
      status: 403,
      body: apiError(ApiErrorCodes.FORBIDDEN, "Wallet session does not own this resource"),
    };
  }

  return { ok: true };
}

export function buildRateLimitError(max: number, after: string) {
  return apiError(ApiErrorCodes.RATE_LIMITED, "Too many write requests", {
    max,
    after,
  });
}
