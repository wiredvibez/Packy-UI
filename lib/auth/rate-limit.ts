import { eq, sql } from "drizzle-orm";
import { sha256Buffer } from "@/lib/auth/crypto";
import { getDb } from "@/lib/db";
import { loginAttempts } from "@/lib/db/schema";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export const LOGIN_RATE_LIMIT = {
  windowMs: WINDOW_MS,
  maxAttempts: MAX_ATTEMPTS,
} as const;

export function getClientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    return parts[parts.length - 1] ?? "unknown";
  }
  return "unknown";
}

export function hashClientIp(ip: string): string {
  return sha256Buffer(ip).toString("hex");
}

export function rateLimitDecision(
  count: number,
  windowStart: Date,
  now = Date.now(),
): { ok: boolean; remaining: number; retryAfterSec: number } {
  const retryAfterSec = Math.max(
    1,
    Math.ceil((windowStart.getTime() + WINDOW_MS - now) / 1000),
  );
  if (count > MAX_ATTEMPTS) {
    return { ok: false, remaining: 0, retryAfterSec };
  }
  return {
    ok: true,
    remaining: MAX_ATTEMPTS - count,
    retryAfterSec: 0,
  };
}

/**
 * Increment first, in one statement, then the caller rejects when over max.
 * The row is shared by every Vercel instance.
 */
export async function consumeLoginAttempt(ip: string) {
  const ipHash = hashClientIp(ip);
  const db = getDb();
  const [row] = await db
    .insert(loginAttempts)
    .values({
      ipHash,
      windowStart: sql`date_bin('15 minutes', now(), timestamptz '2000-01-01 00:00:00+00')`,
      count: 1,
    })
    .onConflictDoUpdate({
      target: [loginAttempts.ipHash, loginAttempts.windowStart],
      set: { count: sql`${loginAttempts.count} + 1` },
    })
    .returning({
      count: loginAttempts.count,
      windowStart: loginAttempts.windowStart,
    });

  if (!row) {
    throw new Error("login attempt was not recorded");
  }
  const windowStart =
    row.windowStart instanceof Date
      ? row.windowStart
      : new Date(String(row.windowStart));
  return rateLimitDecision(row.count, windowStart);
}

export async function clearLoginAttempts(ip: string) {
  const db = getDb();
  await db.delete(loginAttempts).where(eq(loginAttempts.ipHash, hashClientIp(ip)));
}
