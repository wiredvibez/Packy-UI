import type { ShipmentEventRow, ShipmentRow } from "@/lib/db/schema";

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export function serializeShipment(row: ShipmentRow) {
  return {
    id: row.id,
    externalKey: row.externalKey,
    title: row.title,
    merchant: row.merchant,
    items: row.items ?? [],
    orderNumber: row.orderNumber,
    orderDate: iso(row.orderDate),
    carrier: row.carrier,
    trackingNumber: row.trackingNumber,
    trackingUrl: row.trackingUrl,
    status: row.status,
    statusDetail: row.statusDetail,
    eta: iso(row.eta),
    etaStart: iso(row.etaStart),
    etaEnd: iso(row.etaEnd),
    pickupLocation: row.pickupLocation,
    pickupCode: row.pickupCode,
    pickupDeadline: iso(row.pickupDeadline),
    deliveryAddress: row.deliveryAddress,
    cost: row.cost == null ? null : Number(row.cost),
    currency: row.currency,
    needsAction: row.needsAction,
    actionNote: row.actionNote,
    links: row.links ?? [],
    sourceAccount: row.sourceAccount,
    notes: row.notes,
    archived: row.archived,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeEvent(row: ShipmentEventRow) {
  return {
    id: row.id,
    shipmentId: row.shipmentId,
    at: row.at.toISOString(),
    status: row.status,
    description: row.description,
    location: row.location,
    source: row.source,
    createdAt: row.createdAt.toISOString(),
  };
}

export type SerializedShipment = ReturnType<typeof serializeShipment>;
export type SerializedEvent = ReturnType<typeof serializeEvent>;
