export function isUniqueViolation(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if ("code" in current && String(current.code) === "23505") {
      return true;
    }
    const message =
      current instanceof Error
        ? current.message
        : "message" in current
          ? String(current.message)
          : "";
    if (
      message.includes("23505") ||
      message.includes("shipments_external_key_unique")
    ) {
      return true;
    }
    current = "cause" in current ? current.cause : undefined;
  }
  return false;
}
