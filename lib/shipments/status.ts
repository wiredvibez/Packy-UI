export const SHIPMENT_STATUSES = [
  "ordered",
  "processing",
  "shipped",
  "in_transit",
  "customs",
  "out_for_delivery",
  "at_pickup_point",
  "delivered",
  "failed_attempt",
  "exception",
  "returned",
  "cancelled",
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const TERMINAL_STATUSES = [
  "delivered",
  "returned",
  "cancelled",
] as const;

export type TerminalStatus = (typeof TERMINAL_STATUSES)[number];

export const LINK_KINDS = [
  "email",
  "order",
  "tracking",
  "message",
  "other",
] as const;

export type LinkKind = (typeof LINK_KINDS)[number];

export type ShipmentItem = {
  name: string;
  qty?: number;
  price?: number;
  image?: string;
};

export type ShipmentLink = {
  label: string;
  url: string;
  kind: LinkKind;
};

export const STATUS_LABELS_HE: Record<ShipmentStatus, string> = {
  ordered: "הוזמן",
  processing: "בהכנה",
  shipped: "נשלח",
  in_transit: "בדרך",
  customs: "במכס",
  out_for_delivery: "ביציאה למשלוח",
  at_pickup_point: "בנקודת איסוף",
  delivered: "נמסר",
  failed_attempt: "ניסיון מסירה נכשל",
  exception: "חריגה",
  returned: "הוחזר",
  cancelled: "בוטל",
};

export const STATUS_TONE: Record<
  ShipmentStatus,
  "neutral" | "info" | "warn" | "pickup" | "ok" | "danger" | "muted"
> = {
  ordered: "neutral",
  processing: "neutral",
  shipped: "info",
  in_transit: "info",
  customs: "warn",
  out_for_delivery: "info",
  at_pickup_point: "pickup",
  delivered: "ok",
  failed_attempt: "danger",
  exception: "danger",
  returned: "muted",
  cancelled: "muted",
};

export function isShipmentStatus(value: string): value is ShipmentStatus {
  return (SHIPMENT_STATUSES as readonly string[]).includes(value);
}

export function isTerminalStatus(status: ShipmentStatus): boolean {
  return (TERMINAL_STATUSES as readonly ShipmentStatus[]).includes(status);
}

export function isActiveShipment(
  status: ShipmentStatus,
  archived: boolean,
): boolean {
  return !archived && !isTerminalStatus(status);
}
