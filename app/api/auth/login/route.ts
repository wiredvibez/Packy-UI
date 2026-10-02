import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, readJsonBody, zodErrorResponse } from "@/lib/api/errors";
import { verifyPasscode } from "@/lib/auth/passcode";
import {
  clearLoginAttempts,
  consumeLoginAttempt,
  getClientIp,
} from "@/lib/auth/rate-limit";
import { createSessionToken, serializeSessionCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  passcode: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.response;
  }

  const parsed = loginSchema.safeParse(body.data);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  let attempt: { ok: boolean; retryAfterSec: number };
  try {
    attempt = await consumeLoginAttempt(ip);
  } catch (error) {
    console.error("login rate limit failed", error);
    return jsonError(503, "rate_limit_unavailable");
  }
  if (!attempt.ok) {
    return jsonError(429, "too_many_attempts", {
      retryAfterSec: attempt.retryAfterSec,
    });
  }

  if (!verifyPasscode(parsed.data.passcode)) {
    return jsonError(401, "invalid_passcode");
  }

  try {
    await clearLoginAttempts(ip);
  } catch (error) {
    console.error("failed to reset login attempts", error);
  }
  let token: string;
  try {
    token = await createSessionToken();
  } catch {
    return jsonError(500, "session_not_configured");
  }
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", serializeSessionCookie(token));
  return response;
}
