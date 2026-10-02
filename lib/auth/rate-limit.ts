const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export const LOGIN_RATE_LIMIT = {
  windowMs: WINDOW_MS,
  maxAttempts: MAX_ATTEMPTS,
} as const;

function sweep(now: number) {
  if (buckets.size < 200) {
    return;
  }
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

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

export function readRateLimit(key: string): {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
} {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    return { ok: true, remaining: MAX_ATTEMPTS, retryAfterSec: 0 };
  }
  if (bucket.count >= MAX_ATTEMPTS) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return {
    ok: true,
    remaining: MAX_ATTEMPTS - bucket.count,
    retryAfterSec: 0,
  };
}

export function recordFailedAttempt(key: string): {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
} {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_ATTEMPTS - 1, retryAfterSec: 0 };
  }
  existing.count += 1;
  if (existing.count >= MAX_ATTEMPTS) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  return {
    ok: true,
    remaining: MAX_ATTEMPTS - existing.count,
    retryAfterSec: 0,
  };
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}
