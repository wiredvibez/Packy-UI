import { describe, expect, it } from "vitest";
import type { ShipmentRow } from "@/lib/db/schema";
import { decideUpsert, toUpdateSet } from "@/lib/shipments/upsert";
import { shipmentCreateSchema } from "@/lib/validation/shipment";

const existing: ShipmentRow = {
  id: "11111111-1111-1111-1111-111111111111",
  externalKey: "amazon:112-1",
  title: "אוזניות",
  merchant: "Amazon",
  items: [{ name: "אוזניות", qty: 1 }],
  orderNumber: "112-1",
  orderDate: new Date("2026-09-01T10:00:00.000Z"),
  carrier: "DHL",
  trackingNumber: "OLDTRACK",
  trackingUrl: "https://example.com/old",
  status: "ordered",
  statusDetail: "אושר",
  eta: null,
  etaStart: null,
  etaEnd: null,
  pickupLocation: null,
  pickupCode: null,
  pickupDeadline: null,
  deliveryAddress: null,
  cost: "100.00",
  currency: "ILS",
  needsAction: false,
  actionNote: null,
  links: [],
  sourceAccount: "yayatete@gmail.com",
  notes: "לא לגעת",
  archived: false,
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
  updatedAt: new Date("2026-09-01T10:00:00.000Z"),
};

describe("upsert by externalKey", () => {
  it("inserts when no row exists for the key", () => {
    const incoming = shipmentCreateSchema.parse({
      externalKey: "amazon:112-1",
      title: "אוזניות",
      status: "processing",
    });
    const decision = decideUpsert(undefined, incoming);
    expect(decision.action).toBe("insert");
    expect(decision.values).toMatchObject({
      externalKey: "amazon:112-1",
      title: "אוזניות",
      status: "processing",
    });
  });

  it("updates the existing row instead of creating a duplicate", () => {
    const incoming = shipmentCreateSchema.parse({
      externalKey: "amazon:112-1",
      title: "אוזניות Sony",
      status: "in_transit",
      trackingNumber: "NEWTRACK",
    });
    const decision = decideUpsert(existing, incoming);
    expect(decision.action).toBe("update");
    expect(decision.values).toMatchObject({
      title: "אוזניות Sony",
      status: "in_transit",
      trackingNumber: "NEWTRACK",
    });
  });

  it("does not clobber omitted fields on update", () => {
    const patch = toUpdateSet({
      status: "shipped",
      trackingNumber: "ABC",
    });
    expect(patch.status).toBe("shipped");
    expect(patch.trackingNumber).toBe("ABC");
    expect(patch.title).toBeUndefined();
    expect(patch.notes).toBeUndefined();
    expect(patch.merchant).toBeUndefined();
    expect(patch.items).toBeUndefined();
    expect(patch.updatedAt).toBeInstanceOf(Date);
  });

  it("can clear optional fields when the agent sends null", () => {
    const patch = toUpdateSet({
      actionNote: null,
      pickupCode: null,
      cost: null,
    });
    expect(patch.actionNote).toBeNull();
    expect(patch.pickupCode).toBeNull();
    expect(patch.cost).toBeNull();
  });
});
