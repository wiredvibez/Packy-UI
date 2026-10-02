import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/paths";
import { getClientIp } from "@/lib/auth/rate-limit";
import { isUniqueViolation } from "@/lib/db/errors";

describe("safe next path", () => {
  it("keeps in-app paths", () => {
    expect(safeNextPath("/shipments/abc")).toBe("/shipments/abc");
  });

  it("keeps search and hash", () => {
    expect(safeNextPath("/shipments/abc?q=1#code")).toBe(
      "/shipments/abc?q=1#code",
    );
  });

  it("drops open redirects", () => {
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });

  it("drops tab, backslash, and encoded bypasses", () => {
    const fromQuery = (raw: string) =>
      new URL(`http://localhost/login?next=${raw}`).searchParams.get("next");

    expect(safeNextPath("/\t/evil.com")).toBe("/");
    expect(safeNextPath("/\\evil.com")).toBe("/");
    expect(safeNextPath("/\\/evil.com")).toBe("/");
    expect(safeNextPath(fromQuery("/%09/evil.com"))).toBe("/");
    expect(safeNextPath(fromQuery("/%5Cevil.com"))).toBe("/");
    expect(safeNextPath(fromQuery("/%5C/evil.com"))).toBe("/");
    expect(safeNextPath(fromQuery("//evil.com"))).toBe("/");
    expect(safeNextPath(fromQuery("/%0d%0a/evil.com"))).toBe("/");
  });
});

describe("client ip", () => {
  it("prefers x-real-ip over a spoofable forwarded list", () => {
    const headers = new Headers({
      "x-real-ip": "203.0.113.9",
      "x-forwarded-for": "1.1.1.1, 203.0.113.9",
    });
    expect(getClientIp(headers)).toBe("203.0.113.9");
  });

  it("uses the last forwarded hop when x-real-ip is absent", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.1.1.1, 203.0.113.9",
    });
    expect(getClientIp(headers)).toBe("203.0.113.9");
  });
});

describe("unique violation", () => {
  it("detects postgres 23505 and wrapped causes", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(
      isUniqueViolation(new Error("duplicate", { cause: { code: "23505" } })),
    ).toBe(true);
    expect(isUniqueViolation(new Error("nope"))).toBe(false);
  });
});
