import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/paths";
import { getClientIp } from "@/lib/auth/rate-limit";
import { isUniqueViolation } from "@/lib/db/errors";

describe("safe next path", () => {
  it("keeps in-app paths", () => {
    expect(safeNextPath("/shipments/abc")).toBe("/shipments/abc");
  });

  it("drops open redirects", () => {
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
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
