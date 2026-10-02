import { describe, expect, it } from "vitest";
import {
  mapShipment,
  shouldUpdateShipmentStatus,
} from "@/lib/shipments/append-event";

describe("event status updates", () => {
  const older = new Date("2026-10-01T00:00:00.000Z");
  const newer = new Date("2026-10-02T00:00:00.000Z");

  it("does not roll status backward", () => {
    expect(shouldUpdateShipmentStatus(older, newer, "in_transit")).toBe(false);
  });

  it("updates when the event is the newest, or the first", () => {
    expect(shouldUpdateShipmentStatus(newer, older, "delivered")).toBe(true);
    expect(shouldUpdateShipmentStatus(newer, newer, "delivered")).toBe(true);
    expect(shouldUpdateShipmentStatus(newer, null, "shipped")).toBe(true);
  });

  it("stores an event without a status without touching the shipment", () => {
    expect(shouldUpdateShipmentStatus(newer, null, null)).toBe(false);
    expect(shouldUpdateShipmentStatus(newer, null, undefined)).toBe(false);
  });
});

describe("shipment json mapping", () => {
  it("reads the snake_case row returned by the event statement", () => {
    const shipment = mapShipment({
      id: "11111111-1111-1111-1111-111111111111",
      external_key: "amazon:1",
      title: "אוזניות",
      merchant: "Amazon",
      items: [{ name: "אוזניות", qty: 1 }],
      order_number: null,
      order_date: null,
      carrier: null,
      tracking_number: null,
      tracking_url: null,
      status: "in_transit",
      status_detail: null,
      eta: null,
      eta_start: null,
      eta_end: null,
      pickup_location: null,
      pickup_code: null,
      pickup_deadline: null,
      delivery_address: null,
      cost: "10.00",
      currency: "ILS",
      needs_action: false,
      action_note: null,
      links: [],
      source_account: null,
      notes: null,
      archived: false,
      created_at: "2026-10-01T00:00:00.000Z",
      updated_at: "2026-10-02T00:00:00.000Z",
    });
    expect(shipment.externalKey).toBe("amazon:1");
    expect(shipment.updatedAt.toISOString()).toBe("2026-10-02T00:00:00.000Z");
    expect(shipment.cost).toBe("10.00");
  });
});
