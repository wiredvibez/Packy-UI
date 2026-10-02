import type { ShipmentRow } from "@/lib/db/schema";
import { addIsraelDays, israelDateKey, todayIsraelKey } from "@/lib/time/israel";

export type ArrivalGroupId = "today" | "this_week" | "later" | "unknown";

export const ARRIVAL_GROUP_LABELS: Record<ArrivalGroupId, string> = {
  today: "היום",
  this_week: "השבוע",
  later: "אחר כך",
  unknown: "ללא תאריך",
};

export function arrivalDate(shipment: ShipmentRow): Date | null {
  if (shipment.status === "at_pickup_point" && shipment.pickupDeadline) {
    return shipment.pickupDeadline;
  }
  return shipment.eta ?? shipment.etaEnd ?? shipment.etaStart ?? shipment.pickupDeadline;
}

export function arrivalGroup(
  shipment: ShipmentRow,
  now = new Date(),
): ArrivalGroupId {
  const date = arrivalDate(shipment);
  if (!date) return "unknown";
  const key = israelDateKey(date);
  const today = todayIsraelKey(now);
  if (key <= today) return "today";
  const weekEnd = addIsraelDays(today, 7);
  if (key <= weekEnd) return "this_week";
  return "later";
}

export function sortBySoonest(a: ShipmentRow, b: ShipmentRow): number {
  const da = arrivalDate(a);
  const db = arrivalDate(b);
  if (!da && !db) return b.updatedAt.getTime() - a.updatedAt.getTime();
  if (!da) return 1;
  if (!db) return -1;
  return da.getTime() - db.getTime();
}

export function groupActiveShipments(
  rows: ShipmentRow[],
  now = new Date(),
): Record<ArrivalGroupId, ShipmentRow[]> {
  const groups: Record<ArrivalGroupId, ShipmentRow[]> = {
    today: [],
    this_week: [],
    later: [],
    unknown: [],
  };
  for (const row of [...rows].sort(sortBySoonest)) {
    groups[arrivalGroup(row, now)].push(row);
  }
  return groups;
}

const ACTION_STATUSES = new Set(["failed_attempt", "exception", "customs"]);

export function needsActionNow(shipment: ShipmentRow, now = new Date()): boolean {
  if (shipment.needsAction) return true;
  if (ACTION_STATUSES.has(shipment.status)) return true;
  if (shipment.status === "at_pickup_point") return true;
  if (shipment.pickupDeadline) {
    const hours =
      (shipment.pickupDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hours <= 48) return true;
  }
  return false;
}
