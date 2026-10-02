import { createHash, timingSafeEqual } from "node:crypto";

export function sha256Buffer(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * Timing-safe string compare via SHA-256 so unequal lengths cannot leak.
 */
export function timingSafeEqualString(left: string, right: string): boolean {
  const a = sha256Buffer(left);
  const b = sha256Buffer(right);
  return timingSafeEqual(a, b);
}

export function verifySecret(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!provided || !expected) {
    return false;
  }
  return timingSafeEqualString(provided, expected);
}
