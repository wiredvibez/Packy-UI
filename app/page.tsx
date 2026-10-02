import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ArrivalGroups } from "@/components/ArrivalGroups";
import { EmptyState } from "@/components/EmptyState";
import { NeedsActionStrip } from "@/components/NeedsActionStrip";
import { requirePageSession } from "@/lib/auth/session";
import {
  groupActiveShipments,
  needsActionNow,
  sortBySoonest,
} from "@/lib/shipments/arrival";
import { listShipments } from "@/lib/shipments/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requirePageSession();
  const active = await listShipments({ active: true });
  const actionItems = active
    .filter((row) => needsActionNow(row))
    .sort(sortBySoonest);
  const groups = groupActiveShipments(active);

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader current="home" />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div>
          <p className="text-sm text-ink-muted">שלום יאיר</p>
          <h1 className="text-2xl font-semibold tracking-tight">מה מגיע</h1>
        </div>

        <NeedsActionStrip shipments={actionItems} />

        {active.length === 0 ? (
          <EmptyState
            title="שקט בתיבה"
            body="אין משלוחים פעילים כרגע. כשהסוכן יקרא את המייל — או כשתוסיף משהו ידנית — זה יופיע כאן."
            action={
              <Link
                href="/shipments/new"
                className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-paper-2"
              >
                הוסף משלוח
              </Link>
            }
          />
        ) : (
          <ArrivalGroups groups={groups} />
        )}
      </main>
    </div>
  );
}
