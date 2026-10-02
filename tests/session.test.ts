import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readSession, verifySessionToken } from "@/lib/auth/session";

const SECRET = "session-secret-at-least-16";

describe("session tokens", () => {
  const previous = process.env.SESSION_SECRET;

  beforeEach(() => {
    process.env.SESSION_SECRET = SECRET;
  });

  afterEach(() => {
    process.env.SESSION_SECRET = previous;
  });

  it("rejects an unsigned alg=none token", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString(
      "base64url",
    );
    const payload = Buffer.from(
      JSON.stringify({ sub: "yair", iat: 1, exp: 4_000_000_000 }),
    ).toString("base64url");
    expect(await verifySessionToken(`${header}.${payload}.`)).toBe(false);
  });

  it("accepts HS256 and asks for a refresh once the token is a day old", async () => {
    const key = new TextEncoder().encode(SECRET);
    const fresh = await new SignJWT({ sub: "yair" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(key);
    expect(await verifySessionToken(fresh)).toBe(true);
    expect(await readSession(fresh)).toEqual({ valid: true, refresh: false });

    const stale = await new SignJWT({ sub: "yair" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 60 * 60 * 24 - 10)
      .setExpirationTime("30d")
      .sign(key);
    expect(await readSession(stale)).toEqual({ valid: true, refresh: true });
  });
});
