import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { readIngestKey, verifyIngestKey } from "@/lib/auth/ingest";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export async function requireIngestKey(
  request: Request,
): Promise<Response | null> {
  if (verifyIngestKey(readIngestKey(request.headers))) {
    return null;
  }
  return jsonError(401, "unauthorized");
}

export async function requireSessionOrIngest(
  request: NextRequest | Request,
): Promise<Response | null> {
  if (verifyIngestKey(readIngestKey(request.headers))) {
    return null;
  }
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = readCookie(cookieHeader, SESSION_COOKIE);
  if (await verifySessionToken(token)) {
    return null;
  }
  return jsonError(401, "unauthorized");
}

export function readCookie(cookieHeader: string, name: string): string | null {
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}
