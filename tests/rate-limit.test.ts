import { describe, expect, it } from "vitest";
import {
  hashClientIp,
  LOGIN_RATE_LIMIT,
  rateLimitDecision,
} from "@/lib/auth/rate-limit";

describe("login rate limit decision", () => {
  const start = new Date("2026-10-02T10:00:00.000Z");

  it("allows the attempt that lands on the max", () => {
    const decision = rateLimitDecision(LOGIN_RATE_LIMIT.maxAttempts, start, start.getTime());
    expect(decision.ok).toBe(true);
    expect(decision.remaining).toBe(0);
  });

  it("rejects the attempt that goes over the max", () => {
    const decision = rateLimitDecision(
      LOGIN_RATE_LIMIT.maxAttempts + 1,
      start,
      start.getTime() + 30_000,
    );
    expect(decision.ok).toBe(false);
    expect(decision.remaining).toBe(0);
    expect(decision.retryAfterSec).toBeGreaterThan(0);
    expect(decision.retryAfterSec).toBeLessThanOrEqual(LOGIN_RATE_LIMIT.windowMs / 1000);
  });
});

describe("client ip hash", () => {
  it("is stable and not the raw address", () => {
    const hash = hashClientIp("203.0.113.9");
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain("203.0.113.9");
    expect(hashClientIp("203.0.113.9")).toBe(hash);
  });
});
