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

export function safeNextPath(value: string | null | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.includes("\\") || value.includes("://") || value.includes("\0")) {
    return "/";
  }
  return value;
}
