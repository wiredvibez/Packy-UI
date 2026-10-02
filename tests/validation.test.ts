import { describe, expect, it } from "vitest";
import { shipmentCreateSchema, shipmentListQuerySchema } from "@/lib/validation/shipment";

describe("shipment validation", () => {
  it("accepts a full agent payload", () => {
    const parsed = shipmentCreateSchema.parse({
      externalKey: "carrier:IL123",
      title: "חבילה",
      merchant: "iHerb",
      status: "customs",
      eta: "2026-10-08T12:00:00+03:00",
      items: [{ name: "מגנזיום", qty: 2, price: 40 }],
      links: [
        {
          label: "Gmail",
          url: "https://mail.google.com/mail/u/yayatete@gmail.com/#all/abc",
          kind: "email",
        },
      ],
      cost: 40,
      currency: "ILS",
    });
    expect(parsed.eta).toBeInstanceOf(Date);
    expect(parsed.links?.[0]?.kind).toBe("email");
    expect(parsed.links?.[0]?.url).toContain("yayatete@gmail.com");
  });

  it("rejects an unknown status", () => {
    const result = shipmentCreateSchema.safeParse({
      externalKey: "x",
      title: "y",
      status: "flying",
    });
    expect(result.success).toBe(false);
  });

  it("rejects offset-less datetimes and slash dates", () => {
    expect(
      shipmentCreateSchema.safeParse({
        externalKey: "x",
        title: "y",
        eta: "2026-10-02T10:00:00",
      }).success,
    ).toBe(false);
    expect(
      shipmentCreateSchema.safeParse({
        externalKey: "x",
        title: "y",
        eta: "02/10/2026",
      }).success,
    ).toBe(false);
  });

  it("accepts Z, numeric offsets, and plain dates", () => {
    const withZ = shipmentCreateSchema.parse({
      externalKey: "x",
      title: "y",
      eta: "2026-10-01T00:00:00.000Z",
    });
    expect(withZ.eta?.toISOString()).toBe("2026-10-01T00:00:00.000Z");

    const dateOnly = shipmentCreateSchema.parse({
      externalKey: "x",
      title: "y",
      orderDate: "2026-10-02",
    });
    expect(dateOnly.orderDate?.toISOString()).toBe("2026-10-02T00:00:00.000Z");
  });

  it("parses list filters", () => {
    const parsed = shipmentListQuerySchema.parse({
      status: "in_transit,customs",
      active: "true",
      updatedSince: "2026-10-01T00:00:00.000Z",
    });
    expect(parsed.status).toEqual(["in_transit", "customs"]);
    expect(parsed.active).toBe(true);
    expect(parsed.updatedSince).toBeInstanceOf(Date);
  });
});
