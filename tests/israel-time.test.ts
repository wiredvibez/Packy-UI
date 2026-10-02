import { describe, expect, it } from "vitest";
import { formatIsraelInput, israelWallTimeToDate } from "@/lib/time/israel";

describe("Israel wall time", () => {
  it("converts a summer datetime-local value to UTC", () => {
    const date = israelWallTimeToDate("2026-10-02T15:00");
    expect(date?.toISOString()).toBe("2026-10-02T12:00:00.000Z");
  });

  it("converts a winter datetime-local value to UTC", () => {
    const date = israelWallTimeToDate("2026-01-15T15:00");
    expect(date?.toISOString()).toBe("2026-01-15T13:00:00.000Z");
  });

  it("round-trips through the form input format", () => {
    const date = israelWallTimeToDate("2026-10-02T09:30");
    expect(date).not.toBeNull();
    expect(formatIsraelInput(date!)).toBe("2026-10-02T09:30");
  });

  it("rejects garbage", () => {
    expect(israelWallTimeToDate("tomorrow")).toBeNull();
    expect(israelWallTimeToDate("2026-10-02T99:00")).toBeNull();
  });
});
