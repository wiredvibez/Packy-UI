import type { ShipmentRow } from "@/lib/db/schema";
import {
  ARRIVAL_GROUP_LABELS,
  type ArrivalGroupId,
} from "@/lib/shipments/arrival";
import { ShipmentCard } from "@/components/ShipmentCard";

const ORDER: ArrivalGroupId[] = ["today", "this_week", "later", "unknown"];

export function ArrivalGroups({
  groups,
}: {
  groups: Record<ArrivalGroupId, ShipmentRow[]>;
}) {
  return (
    <div className="space-y-6">
      {ORDER.map((id) => {
        const rows = groups[id];
        if (!rows.length) return null;
        return (
          <section key={id}>
            <h2 className="mb-3 text-sm font-semibold text-ink-muted">
              {ARRIVAL_GROUP_LABELS[id]}
            </h2>
            <div className="space-y-3">
              {rows.map((shipment) => (
                <ShipmentCard key={shipment.id} shipment={shipment} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
