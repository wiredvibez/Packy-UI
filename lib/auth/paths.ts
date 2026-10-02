export const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/health"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isReadApiPath(pathname: string): boolean {
  return pathname === "/api/shipments" || pathname.startsWith("/api/shipments/");
}

export function isWriteApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/shipments");
}

const SAFE_ORIGIN = "http://x";

/**
 * Keep post-login navigation on this site.
 * `new URL` is what the browser uses, so tab/backslash tricks that change
 * the host are rejected instead of trusted as a path.
 */
export function safeNextPath(value: string | null | undefined): string {
  if (!value) return "/";

  let url: URL;
  try {
    url = new URL(value, `${SAFE_ORIGIN}/`);
  } catch {
    return "/";
  }
  if (url.origin !== SAFE_ORIGIN) return "/";

  const next = `${url.pathname}${url.search}${url.hash}`;
  if (!next.startsWith("/") || next.startsWith("//")) return "/";

  try {
    const again = new URL(next, `${SAFE_ORIGIN}/`);
    if (again.origin !== SAFE_ORIGIN) return "/";
  } catch {
    return "/";
  }

  return next;
}
