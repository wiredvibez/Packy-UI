import { sql } from "drizzle-orm";
import type { ShipmentEventRow, ShipmentRow } from "@/lib/db/schema";
import { getDb } from "@/lib/db";
import type { ShipmentStatus } from "@/lib/shipments/status";

export function shouldUpdateShipmentStatus(
  eventAt: Date,
  latestAt: Date | null,
  status: string | null | undefined,
): boolean {
  if (!status) return false;
  if (!latestAt) return true;
  return eventAt.getTime() >= latestAt.getTime();
}

type AppendInput = {
  shipmentId: string;
  at: Date;
  status?: ShipmentStatus;
  description?: string;
  location?: string;
  source?: string;
};

/**
 * Insert the event and, when it is at least as new as the latest one,
 * update the shipment status. One statement so a failed status write
 * cannot leave a duplicate-able event behind.
 *
 * The status rule matches `shouldUpdateShipmentStatus`.
 */
export async function appendShipmentEvent(
  input: AppendInput,
): Promise<{ event: ShipmentEventRow; shipment: ShipmentRow } | null> {
  const db = getDb();
  const result = await db.execute(sql`
    WITH locked AS (
      SELECT * FROM shipments WHERE id = ${input.shipmentId}::uuid FOR UPDATE
    ),
    latest AS (
      SELECT max(at) AS latest_at
      FROM shipment_events
      WHERE shipment_id = ${input.shipmentId}::uuid
    ),
    inserted AS (
      INSERT INTO shipment_events (
        shipment_id, at, status, description, location, source
      )
      SELECT
        locked.id,
        ${input.at}::timestamptz,
        CAST(${input.status ?? null} AS shipment_status),
        ${input.description ?? null},
        ${input.location ?? null},
        ${input.source ?? null}
      FROM locked
      RETURNING *
    ),
    updated AS (
      UPDATE shipments AS shipment
      SET
        status = inserted.status,
        updated_at = now()
      FROM inserted
      LEFT JOIN latest ON true
      WHERE shipment.id = inserted.shipment_id
        AND inserted.status IS NOT NULL
        AND (latest.latest_at IS NULL OR inserted.at >= latest.latest_at)
      RETURNING shipment.*
    )
    SELECT
      (SELECT row_to_json(row) FROM inserted AS row) AS event,
      COALESCE(
        (SELECT row_to_json(row) FROM updated AS row),
        (SELECT row_to_json(row) FROM locked AS row)
      ) AS shipment
  `);

  const [row] = resultRows(result);
  if (!row) return null;
  const event = asRecord(row.event);
  const shipment = asRecord(row.shipment);
  if (!event || !shipment) return null;
  return {
    event: mapEvent(event),
    shipment: mapShipment(shipment),
  };
}

function resultRows(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[];
  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray(result.rows)
  ) {
    return result.rows as Record<string, unknown>[];
  }
  return [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (typeof value === "object") return value as Record<string, unknown>;
  return null;
}

function asDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function requiredDate(value: unknown): Date {
  const date = asDate(value);
  if (!date) throw new Error("expected a timestamp");
  return date;
}

function asString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

export function mapShipment(raw: Record<string, unknown>): ShipmentRow {
  return {
    id: String(raw.id),
    externalKey: String(raw.external_key),
    title: String(raw.title),
    merchant: asString(raw.merchant),
    items: Array.isArray(raw.items) ? (raw.items as ShipmentRow["items"]) : [],
    orderNumber: asString(raw.order_number),
    orderDate: asDate(raw.order_date),
    carrier: asString(raw.carrier),
    trackingNumber: asString(raw.tracking_number),
    trackingUrl: asString(raw.tracking_url),
    status: raw.status as ShipmentRow["status"],
    statusDetail: asString(raw.status_detail),
    eta: asDate(raw.eta),
    etaStart: asDate(raw.eta_start),
    etaEnd: asDate(raw.eta_end),
    pickupLocation: asString(raw.pickup_location),
    pickupCode: asString(raw.pickup_code),
    pickupDeadline: asDate(raw.pickup_deadline),
    deliveryAddress: asString(raw.delivery_address),
    cost: raw.cost == null ? null : String(raw.cost),
    currency: asString(raw.currency),
    needsAction: Boolean(raw.needs_action),
    actionNote: asString(raw.action_note),
    links: Array.isArray(raw.links) ? (raw.links as ShipmentRow["links"]) : [],
    sourceAccount: asString(raw.source_account),
    notes: asString(raw.notes),
    archived: Boolean(raw.archived),
    createdAt: requiredDate(raw.created_at),
    updatedAt: requiredDate(raw.updated_at),
  };
}

function mapEvent(raw: Record<string, unknown>): ShipmentEventRow {
  return {
    id: String(raw.id),
    shipmentId: String(raw.shipment_id),
    at: requiredDate(raw.at),
    status: (raw.status ?? null) as ShipmentEventRow["status"],
    description: asString(raw.description),
    location: asString(raw.location),
    source: asString(raw.source),
    createdAt: requiredDate(raw.created_at),
  };
}
