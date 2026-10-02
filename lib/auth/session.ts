import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "packy_session";
/** 30 days. Page views slide it forward after the token is a day old. */
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;
const SESSION_SUBJECT = "yair";

function getSessionSecret(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    return null;
  }
  return new TextEncoder().encode(secret);
}

export function isSessionSecretConfigured(): boolean {
  return getSessionSecret() !== null;
}

export async function createSessionToken(): Promise<string> {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("SESSION_SECRET is missing or shorter than 16 characters");
  }
  return new SignJWT({ sub: SESSION_SUBJECT })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(secret);
}

const REFRESH_AFTER_SEC = 60 * 60 * 24;

type SessionPayload = {
  valid: true;
  refresh: boolean;
};

async function readToken(token: string | undefined | null) {
  if (!token) return null;
  const secret = getSessionSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    if (payload.sub !== SESSION_SUBJECT) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  return (await readToken(token)) !== null;
}

/** Valid session, plus whether the 30-day cookie should slide forward. */
export async function readSession(
  token: string | undefined | null,
): Promise<SessionPayload | { valid: false }> {
  const payload = await readToken(token);
  if (!payload) return { valid: false };
  const issuedAt = payload.iat ?? 0;
  const age = Math.floor(Date.now() / 1000) - issuedAt;
  return { valid: true, refresh: age >= REFRESH_AFTER_SEC };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export async function hasSessionFromCookieStore(
  cookieStore: { get(name: string): { value: string } | undefined },
): Promise<boolean> {
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function requirePageSession(): Promise<void> {
  const cookieStore = await cookies();
  const ok = await hasSessionFromCookieStore(cookieStore);
  if (!ok) {
    redirect("/login");
  }
}
