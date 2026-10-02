import { describe, expect, it } from "vitest";
import type { ShipmentRow } from "@/lib/db/schema";
import { arrivalGroup, needsActionNow } from "@/lib/shipments/arrival";

function row(partial: Partial<ShipmentRow>): ShipmentRow {
  return {
    id: "1",
    externalKey: "k",
    title: "t",
    merchant: null,
    items: [],
    orderNumber: null,
    orderDate: null,
    carrier: null,
    trackingNumber: null,
    trackingUrl: null,
    status: "in_transit",
    statusDetail: null,
    eta: null,
    etaStart: null,
    etaEnd: null,
    pickupLocation: null,
    pickupCode: null,
    pickupDeadline: null,
    deliveryAddress: null,
    cost: null,
    currency: "ILS",
    needsAction: false,
    actionNote: null,
    links: [],
    sourceAccount: null,
    notes: null,
    archived: false,
    createdAt: new Date("2026-10-01T00:00:00Z"),
    updatedAt: new Date("2026-10-01T00:00:00Z"),
    ...partial,
  };
}

describe("arrival grouping", () => {
  const now = new Date("2026-10-02T10:00:00+03:00");

  it("groups today / this week / later / unknown", () => {
    expect(
      arrivalGroup(row({ eta: new Date("2026-10-02T18:00:00+03:00") }), now),
    ).toBe("today");
    expect(
      arrivalGroup(row({ eta: new Date("2026-10-06T18:00:00+03:00") }), now),
    ).toBe("this_week");
    expect(
      arrivalGroup(row({ eta: new Date("2026-10-20T18:00:00+03:00") }), now),
    ).toBe("later");
    expect(arrivalGroup(row({ eta: null }), now)).toBe("unknown");
  });

  it("flags pickup deadlines and exceptions as needing action", () => {
    expect(needsActionNow(row({ status: "exception" }), now)).toBe(true);
    expect(
      needsActionNow(
        row({
          status: "at_pickup_point",
          pickupDeadline: new Date("2026-10-03T12:00:00+03:00"),
        }),
        now,
      ),
    ).toBe(true);
    expect(needsActionNow(row({ status: "at_pickup_point" }), now)).toBe(true);
    expect(needsActionNow(row({ status: "in_transit" }), now)).toBe(false);
  });
});
