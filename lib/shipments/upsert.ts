import type { NewShipmentRow, ShipmentRow } from "@/lib/db/schema";
import type { ShipmentWriteInput } from "@/lib/validation/shipment";

export function costToNumeric(
  cost: number | null | undefined,
): string | null | undefined {
  if (cost === undefined) return undefined;
  if (cost === null) return null;
  return cost.toFixed(2);
}

export function toInsertValues(input: ShipmentWriteInput): NewShipmentRow {
  return {
    externalKey: input.externalKey,
    title: input.title,
    merchant: input.merchant ?? null,
    items: input.items ?? [],
    orderNumber: input.orderNumber ?? null,
    orderDate: input.orderDate ?? null,
    carrier: input.carrier ?? null,
    trackingNumber: input.trackingNumber ?? null,
    trackingUrl: input.trackingUrl ?? null,
    status: input.status ?? "ordered",
    statusDetail: input.statusDetail ?? null,
    eta: input.eta ?? null,
    etaStart: input.etaStart ?? null,
    etaEnd: input.etaEnd ?? null,
    pickupLocation: input.pickupLocation ?? null,
    pickupCode: input.pickupCode ?? null,
    pickupDeadline: input.pickupDeadline ?? null,
    deliveryAddress: input.deliveryAddress ?? null,
    cost: costToNumeric(input.cost) ?? null,
    currency: input.currency === undefined ? "ILS" : input.currency,
    needsAction: input.needsAction ?? false,
    actionNote: input.actionNote ?? null,
    links: input.links ?? [],
    sourceAccount: input.sourceAccount ?? null,
    notes: input.notes ?? null,
    archived: input.archived ?? false,
  };
}

export function toUpdateSet(
  input: Partial<ShipmentWriteInput>,
): Partial<NewShipmentRow> {
  const next: Partial<NewShipmentRow> = {};

  if (input.externalKey !== undefined) next.externalKey = input.externalKey;
  if (input.title !== undefined) next.title = input.title;
  if (input.merchant !== undefined) next.merchant = input.merchant;
  if (input.items !== undefined) next.items = input.items;
  if (input.orderNumber !== undefined) next.orderNumber = input.orderNumber;
  if (input.orderDate !== undefined) next.orderDate = input.orderDate;
  if (input.carrier !== undefined) next.carrier = input.carrier;
  if (input.trackingNumber !== undefined) {
    next.trackingNumber = input.trackingNumber;
  }
  if (input.trackingUrl !== undefined) next.trackingUrl = input.trackingUrl;
  if (input.status !== undefined) next.status = input.status;
  if (input.statusDetail !== undefined) next.statusDetail = input.statusDetail;
  if (input.eta !== undefined) next.eta = input.eta;
  if (input.etaStart !== undefined) next.etaStart = input.etaStart;
  if (input.etaEnd !== undefined) next.etaEnd = input.etaEnd;
  if (input.pickupLocation !== undefined) {
    next.pickupLocation = input.pickupLocation;
  }
  if (input.pickupCode !== undefined) next.pickupCode = input.pickupCode;
  if (input.pickupDeadline !== undefined) {
    next.pickupDeadline = input.pickupDeadline;
  }
  if (input.deliveryAddress !== undefined) {
    next.deliveryAddress = input.deliveryAddress;
  }
  if (input.cost !== undefined) next.cost = costToNumeric(input.cost);
  if (input.currency !== undefined) next.currency = input.currency;
  if (input.needsAction !== undefined) next.needsAction = input.needsAction;
  if (input.actionNote !== undefined) next.actionNote = input.actionNote;
  if (input.links !== undefined) next.links = input.links;
  if (input.sourceAccount !== undefined) next.sourceAccount = input.sourceAccount;
  if (input.notes !== undefined) next.notes = input.notes;
  if (input.archived !== undefined) next.archived = input.archived;

  next.updatedAt = new Date();
  return next;
}

export function decideUpsert(
  existing: ShipmentRow | undefined,
  incoming: ShipmentWriteInput,
): { action: "insert" | "update"; values: NewShipmentRow | Partial<NewShipmentRow> } {
  if (!existing) {
    return { action: "insert", values: toInsertValues(incoming) };
  }
  return { action: "update", values: toUpdateSet(incoming) };
}
