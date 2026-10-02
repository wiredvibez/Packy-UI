import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, readJsonBody, zodErrorResponse } from "@/lib/api/errors";
import { verifyPasscode } from "@/lib/auth/passcode";
import {
  clearRateLimit,
  getClientIp,
  LOGIN_RATE_LIMIT,
  readRateLimit,
  recordFailedAttempt,
} from "@/lib/auth/rate-limit";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  passcode: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const limited = readRateLimit(ip);
  if (!limited.ok) {
    return jsonError(429, "too_many_attempts", {
      retryAfterSec: limited.retryAfterSec,
    });
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.response;
  }

  const parsed = loginSchema.safeParse(body.data);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  if (!verifyPasscode(parsed.data.passcode)) {
    const after = recordFailedAttempt(ip);
    if (!after.ok) {
      return jsonError(429, "too_many_attempts", {
        retryAfterSec: after.retryAfterSec,
        maxAttempts: LOGIN_RATE_LIMIT.maxAttempts,
      });
    }
    return jsonError(401, "invalid_passcode");
  }

  clearRateLimit(ip);
  let token: string;
  try {
    token = await createSessionToken();
  } catch {
    return jsonError(500, "session_not_configured");
  }
  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE, token, sessionCookieOptions()),
  );
  return response;
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
    path: string;
    maxAge: number;
  },
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
    `SameSite=${options.sameSite}`,
  ];
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}
