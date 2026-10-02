import { describe, expect, it } from "vitest";
import { parseLinkText } from "@/lib/shipments/links";
import { normalizeHttpUrl } from "@/lib/validation/url";
import { shipmentCreateSchema } from "@/lib/validation/shipment";

const base = { externalKey: "x", title: "y" };

describe("http urls", () => {
  it("keeps http and https", () => {
    expect(normalizeHttpUrl("https://example.com/track")).toBe(
      "https://example.com/track",
    );
    expect(normalizeHttpUrl(" http://example.com/a ")).toBe(
      "http://example.com/a",
    );
  });

  it("drops javascript and data urls, including disguised ones", () => {
    expect(normalizeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeHttpUrl("JavaScript:alert(1)")).toBeNull();
    expect(normalizeHttpUrl("java\tscript:alert(1)")).toBeNull();
    expect(normalizeHttpUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(normalizeHttpUrl("data:text/html,hi")).toBeNull();
  });
});

describe("shipment url schema", () => {
  it("rejects javascript and data on tracking links", () => {
    expect(
      shipmentCreateSchema.safeParse({
        ...base,
        trackingUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    expect(
      shipmentCreateSchema.safeParse({
        ...base,
        links: [{ label: "x", url: "data:text/html,hi", kind: "other" }],
      }).success,
    ).toBe(false);
  });

  it("accepts an https tracking url and link", () => {
    const parsed = shipmentCreateSchema.parse({
      ...base,
      trackingUrl: "https://example.com/track",
      links: [
        { label: "מעקב", url: "https://example.com/track", kind: "tracking" },
      ],
    });
    expect(parsed.trackingUrl).toBe("https://example.com/track");
    expect(parsed.links?.[0]?.url).toBe("https://example.com/track");
  });
});

describe("manual link lines", () => {
  it("keeps https rows and drops javascript rows", () => {
    const links = parseLinkText(
      [
        "אימייל | https://mail.google.com/mail/u/0/#all/abc | email",
        "רע | javascript:alert(1) | other",
        "דאטה | data:text/html,hi | other",
      ].join("\n"),
    );
    expect(links).toHaveLength(1);
    expect(links[0]?.url.startsWith("https://mail.google.com/")).toBe(true);
    expect(links[0]?.kind).toBe("email");
  });
});
