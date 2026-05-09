import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const SESSION_COOKIE_NAME = "dex_session";
const DEV_SESSION_SECRET = "development-session-secret-change-before-production";

export type SessionPayload = {
  userId: string;
  walletId: string;
  address: string;
  chainId: number;
  verified: boolean;
  exp: number;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSessionToken(
  payload: Omit<SessionPayload, "exp">,
  secret = DEV_SESSION_SECRET,
): string {
  const body: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encodedBody = base64UrlEncode(JSON.stringify(body));

  return `${encodedBody}.${sign(encodedBody, secret)}`;
}

export function verifySessionToken(token: string, secret = DEV_SESSION_SECRET): SessionPayload | null {
  const [encodedBody, signature] = token.split(".");
  if (encodedBody === undefined || signature === undefined) {
    return null;
  }

  const expectedSignature = sign(encodedBody, secret);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedBody, "base64url").toString("utf8")) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getSessionTokenFromCookie(cookieHeader: string | undefined): string | null {
  if (cookieHeader === undefined) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const sessionCookie = cookies.find((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`));

  return sessionCookie?.slice(SESSION_COOKIE_NAME.length + 1) ?? null;
}

export function sessionCookieHeader({
  token,
  secure,
}: {
  token: string;
  secure: boolean;
}): string {
  const attributes = [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];

  if (secure) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}
