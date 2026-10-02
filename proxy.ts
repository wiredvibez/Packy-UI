import { NextResponse, type NextRequest } from "next/server";
import { verifyIngestKey, readIngestKey } from "@/lib/auth/ingest";
import { isPublicPath, isReadApiPath } from "@/lib/auth/paths";
import {
  SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    if (pathname === "/login") {
      const token = request.cookies.get(SESSION_COOKIE)?.value;
      if (await verifySessionToken(token)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (isReadApiPath(pathname) && request.method === "GET") {
      const hasKey = verifyIngestKey(readIngestKey(request.headers));
      const hasSession = await verifySessionToken(
        request.cookies.get(SESSION_COOKIE)?.value,
      );
      if (!hasKey && !hasSession) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
