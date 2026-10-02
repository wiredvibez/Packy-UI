import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ShipmentForm } from "@/components/ShipmentForm";
import { updateManualShipment } from "@/lib/actions/shipments";
import { requirePageSession } from "@/lib/auth/session";
import { getShipmentById } from "@/lib/shipments/queries";
import { isUuid } from "@/lib/validation/id";

export const dynamic = "force-dynamic";

export default async function EditShipmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePageSession();
  const { id } = await params;
  const { error } = await searchParams;
  if (!isUuid(id)) {
    notFound();
  }
  const shipment = await getShipmentById(id);
  if (!shipment) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-lg px-4 py-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <h1 className="mb-4 text-2xl font-semibold">עריכת משלוח</h1>
        {error === "duplicate" ? (
          <p className="mb-3 rounded-2xl bg-rose-soft px-3 py-2 text-sm text-rose">
            המפתח החיצוני כבר שייך למשלוח אחר.
          </p>
        ) : null}
        <div className="rounded-3xl border border-line bg-paper-2 p-4">
          <ShipmentForm
            shipment={shipment}
            action={updateManualShipment}
            submitLabel="עדכון"
          />
        </div>
      </main>
    </div>
  );
}
