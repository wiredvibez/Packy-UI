import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { requireIngestKey, requireSessionOrIngest } from "@/lib/api/guard";
import { verifyIngestKey } from "@/lib/auth/ingest";
import { verifySecret } from "@/lib/auth/crypto";

const KEY = "packy-test-ingest-key";

describe("ingest key comparison", () => {
  const previous = process.env.PACKY_INGEST_KEY;

  beforeEach(() => {
    process.env.PACKY_INGEST_KEY = KEY;
  });

  afterEach(() => {
    process.env.PACKY_INGEST_KEY = previous;
  });

  it("accepts the exact key", () => {
    expect(verifyIngestKey(KEY)).toBe(true);
  });

  it("rejects a wrong key of the same length", () => {
    expect(verifyIngestKey("packy-test-ingest-kez")).toBe(false);
  });

  it("rejects missing or empty keys without throwing", () => {
    expect(verifyIngestKey(null)).toBe(false);
    expect(verifyIngestKey("")).toBe(false);
    expect(verifySecret("abc", "")).toBe(false);
    expect(verifySecret("", KEY)).toBe(false);
  });

  it("rejects when the env key is unset", () => {
    delete process.env.PACKY_INGEST_KEY;
    expect(verifyIngestKey(KEY)).toBe(false);
  });
});

describe("ingest API guards", () => {
  const previous = process.env.PACKY_INGEST_KEY;

  beforeEach(() => {
    process.env.PACKY_INGEST_KEY = KEY;
  });

  afterEach(() => {
    process.env.PACKY_INGEST_KEY = previous;
  });

  it("allows POST when x-packy-key matches", async function () {
    const request = new Request("http://localhost/api/shipments", {
      method: "POST",
      headers: { "x-packy-key": KEY },
    });
    expect(await requireIngestKey(request)).toBeNull();
  });

  it("blocks POST with a missing or wrong key", async function () {
    const missing = await requireIngestKey(
      new Request("http://localhost/api/shipments", { method: "POST" }),
    );
    expect(missing?.status).toBe(401);

    const wrong = await requireIngestKey(
      new Request("http://localhost/api/shipments", {
        method: "POST",
        headers: { "x-packy-key": "nope" },
      }),
    );
    expect(wrong?.status).toBe(401);
  });

  it("allows GET with the ingest key and rejects an anonymous read", async function () {
    const allowed = await requireSessionOrIngest(
      new Request("http://localhost/api/shipments", {
        headers: { "x-packy-key": KEY },
      }),
    );
    expect(allowed).toBeNull();

    const denied = await requireSessionOrIngest(
      new Request("http://localhost/api/shipments"),
    );
    expect(denied?.status).toBe(401);
  });
});
