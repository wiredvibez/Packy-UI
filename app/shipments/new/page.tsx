import { AppHeader } from "@/components/AppHeader";
import { ShipmentForm } from "@/components/ShipmentForm";
import { createManualShipment } from "@/lib/actions/shipments";
import { requirePageSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function NewShipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePageSession();
  const { error } = await searchParams;
  return (
    <div className="flex min-h-full flex-col">
      <AppHeader current="new" />
      <main className="mx-auto w-full max-w-lg px-4 py-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <h1 className="mb-4 text-2xl font-semibold">הוספה ידנית</h1>
        {error === "duplicate" ? (
          <p className="mb-3 rounded-2xl bg-rose-soft px-3 py-2 text-sm text-rose">
            כבר קיים משלוח עם אותו מפתח חיצוני.
          </p>
        ) : null}
        <div className="rounded-3xl border border-line bg-paper-2 p-4">
          <ShipmentForm action={createManualShipment} submitLabel="שמירה" />
        </div>
      </main>
    </div>
  );
}
