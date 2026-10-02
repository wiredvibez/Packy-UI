import { serializeSessionCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", serializeSessionCookie("", 0));
  return response;
}
