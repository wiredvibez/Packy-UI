import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "packy_session";
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

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) {
    return false;
  }
  const secret = getSessionSecret();
  if (!secret) {
    return false;
  }
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.sub === SESSION_SUBJECT;
  } catch {
    return false;
  }
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
