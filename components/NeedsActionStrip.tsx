import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { ShipmentRow } from "@/lib/db/schema";
import { formatDateTimeHe, relativeTimeHe } from "@/lib/time/hebrew";

export function NeedsActionStrip({ shipments }: { shipments: ShipmentRow[] }) {
  if (!shipments.length) return null;

  return (
    <section className="rounded-3xl bg-rose-soft/80 p-4">
      <div className="mb-3 flex items-center gap-2 text-rose">
        <AlertTriangle className="size-4" aria-hidden />
        <h2 className="text-sm font-semibold">צריך טיפול</h2>
      </div>
      <ul className="space-y-2">
        {shipments.map((shipment) => (
          <li key={shipment.id}>
            <Link
              href={`/shipments/${shipment.id}`}
              className="block rounded-2xl bg-paper-2 px-3 py-2.5"
            >
              <p className="font-medium">{shipment.title}</p>
              <p className="text-sm text-ink-muted">
                {shipment.actionNote ??
                  shipment.statusDetail ??
                  (shipment.pickupDeadline
                    ? `איסוף עד ${formatDateTimeHe(shipment.pickupDeadline)}`
                    : "דורש בדיקה")}
                {shipment.pickupDeadline
                  ? ` · ${relativeTimeHe(shipment.pickupDeadline)}`
                  : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
