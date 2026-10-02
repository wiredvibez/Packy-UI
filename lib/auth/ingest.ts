import { verifySecret } from "@/lib/auth/crypto";

export const INGEST_HEADER = "x-packy-key";

export function isIngestKeyConfigured(): boolean {
  return Boolean(process.env.PACKY_INGEST_KEY);
}

export function verifyIngestKey(provided: string | null | undefined): boolean {
  return verifySecret(provided, process.env.PACKY_INGEST_KEY);
}

export function readIngestKey(headers: Headers): string | null {
  return headers.get(INGEST_HEADER);
}
