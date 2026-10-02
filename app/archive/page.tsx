import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { ShipmentCard } from "@/components/ShipmentCard";
import { requirePageSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { shipments } from "@/lib/db/schema";
import { TERMINAL_STATUSES } from "@/lib/shipments/status";

export const dynamic = "force-dynamic";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePageSession();
  const { q } = await searchParams;
  const query = (q?.trim() ?? "").replace(/[%_]/g, "");
  const db = getDb();

  const archiveScope = or(
    eq(shipments.archived, true),
    inArray(shipments.status, [...TERMINAL_STATUSES]),
  )!;

  const where = query
    ? and(
        archiveScope,
        or(
          ilike(shipments.title, `%${query}%`),
          ilike(shipments.merchant, `%${query}%`),
          ilike(shipments.trackingNumber, `%${query}%`),
          ilike(shipments.orderNumber, `%${query}%`),
          ilike(shipments.carrier, `%${query}%`),
        ),
      )
    : archiveScope;

  const rows = await db
    .select()
    .from(shipments)
    .where(where)
    .orderBy(desc(shipments.updatedAt))
    .limit(150);

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader current="archive" />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <h1 className="text-2xl font-semibold">נמסר וארכיון</h1>
        <form className="sticky top-[4.5rem] z-10 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="חיפוש לפי חנות, מעקב או הזמנה"
            className="field"
          />
          <button
            type="submit"
            className="shrink-0 rounded-2xl bg-sage px-4 text-sm font-semibold text-paper-2"
          >
            חיפוש
          </button>
        </form>
        {rows.length === 0 ? (
          <EmptyState
            title={query ? "לא נמצא דבר" : "הארכיון ריק"}
            body={
              query
                ? "נסה מילה אחרת, או נקה את החיפוש."
                : "משלוחים שנמסרו, הוחזרו או הועברו לארכיון יופיעו כאן."
            }
          />
        ) : (
          <div className="space-y-3">
            {rows.map((shipment) => (
              <ShipmentCard key={shipment.id} shipment={shipment} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
