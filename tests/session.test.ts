import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSessionToken,
  readSession,
  serializeSessionCookie,
  verifySessionToken,
} from "@/lib/auth/session";

const SECRET = "session-secret-at-least-16";

describe("session tokens", () => {
  const previous = process.env.SESSION_SECRET;
  const previousVersion = process.env.SESSION_VERSION;

  beforeEach(() => {
    process.env.SESSION_SECRET = SECRET;
    delete process.env.SESSION_VERSION;
  });

  afterEach(() => {
    process.env.SESSION_SECRET = previous;
    if (previousVersion === undefined) delete process.env.SESSION_VERSION;
    else process.env.SESSION_VERSION = previousVersion;
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
    const fresh = await new SignJWT({ sub: "yair", ver: "1" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(key);
    expect(await verifySessionToken(fresh)).toBe(true);
    expect(await readSession(fresh)).toEqual({ valid: true, refresh: false });

    const stale = await new SignJWT({ sub: "yair", ver: "1" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 60 * 60 * 24 - 10)
      .setExpirationTime("30d")
      .sign(key);
    expect(await readSession(stale)).toEqual({ valid: true, refresh: true });
  });

  it("rejects a token from a previous SESSION_VERSION", async () => {
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);
    process.env.SESSION_VERSION = "2";
    expect(await verifySessionToken(token)).toBe(false);
    expect(await verifySessionToken(await createSessionToken())).toBe(true);
  });
});

describe("logout cookie", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("clears with Secure in production so the browser drops the cookie", () => {
    vi.stubEnv("NODE_ENV", "production");
    const header = serializeSessionCookie("", 0);
    expect(header).toContain("Max-Age=0");
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=lax");
  });
});
