import { existsSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { and, eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { shipmentEvents, shipments } from "../lib/db/schema";

if (existsSync(".env")) {
  loadEnv({ path: ".env" });
}
if (existsSync(".env.local")) {
  loadEnv({ path: ".env.local", override: true });
}

if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
  console.error("Refusing to seed in production.");
  process.exit(1);
}

if (process.env.PACKY_SEED !== "1") {
  console.error("Local-only seed. Re-run with PACKY_SEED=1.");
  process.exit(1);
}

async function seed() {
  const db = getDb();
  const now = new Date();

  const samples = [
    {
      externalKey: "seed:amazon:112-FAKE-0001",
      title: "אוזניות Sony WH-1000XM5",
      merchant: "Amazon",
      items: [{ name: "Sony WH-1000XM5", qty: 1, price: 1299 }],
      orderNumber: "112-FAKE-0001",
      orderDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      carrier: "DHL",
      trackingNumber: "DHLFAKE123456",
      trackingUrl: "https://www.dhl.com/il-en/home/tracking.html",
      status: "in_transit" as const,
      statusDetail: "עזב את המרכז בלייפציג",
      eta: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      cost: "1299.00",
      currency: "ILS",
      links: [
        {
          label: "אימייל אישור",
          url: "https://mail.google.com/mail/u/yayatete@gmail.com/#all/seedmessage1",
          kind: "email" as const,
        },
        {
          label: "הזמנה באמזון",
          url: "https://www.amazon.com/gp/your-account/order-details?orderID=112-FAKE-0001",
          kind: "order" as const,
        },
      ],
      sourceAccount: "yayatete@gmail.com",
      notes: "נתוני דמו ללוקאל בלבד",
    },
    {
      externalKey: "seed:israel-post:PU-FAKE-77",
      title: "חבילה מ-AliExpress",
      merchant: "AliExpress",
      items: [{ name: "כבל USB-C", qty: 3, price: 42 }],
      carrier: "דואר ישראל",
      trackingNumber: "RRFAKE778899IL",
      status: "at_pickup_point" as const,
      pickupLocation: "חנות חי פארם, דיזנגוף 50",
      pickupCode: "448821",
      pickupDeadline: new Date(now.getTime() + 36 * 60 * 60 * 1000),
      needsAction: true,
      actionNote: "לאסוף עד מחר בערב",
      links: [
        {
          label: "הודעת איסוף",
          url: "https://mail.google.com/mail/u/yayatete@gmail.com/#all/seedmessage2",
          kind: "message" as const,
        },
      ],
      sourceAccount: "yayatete@gmail.com",
    },
    {
      externalKey: "seed:iherb:A1-FAKE",
      title: "הזמנת iHerb",
      merchant: "iHerb",
      items: [{ name: "מגנזיום", qty: 2, price: 89 }],
      status: "customs" as const,
      statusDetail: "ממתין לתשלום מכס",
      needsAction: true,
      actionNote: "יש אגרה לשלם במכס",
      eta: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      links: [
        {
          label: "אימייל מכס",
          url: "https://mail.google.com/mail/u/yayatete@gmail.com/#all/seedmessage3",
          kind: "email" as const,
        },
      ],
    },
    {
      externalKey: "seed:ksp:delivered-1",
      title: "מקלדת Keychron",
      merchant: "KSP",
      status: "delivered" as const,
      eta: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      trackingNumber: "KSPFAKE001",
      archived: false,
    },
  ];

  for (const sample of samples) {
    const [row] = await db
      .insert(shipments)
      .values(sample)
      .onConflictDoUpdate({
        target: shipments.externalKey,
        set: { ...sample, updatedAt: new Date() },
      })
      .returning();

    await db
      .delete(shipmentEvents)
      .where(
        and(eq(shipmentEvents.shipmentId, row.id), eq(shipmentEvents.source, "seed")),
      );
    await db.insert(shipmentEvents).values({
      shipmentId: row.id,
      at: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      status: sample.status,
      description: "אירוע דמו שנוצר ע״י הסקריפט המקומי",
      source: "seed",
    });
  }

  console.log("Seeded fake local shipments.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
