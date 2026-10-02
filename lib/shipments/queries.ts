import { and, desc, eq, gte, inArray, notInArray, or, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { shipmentEvents, shipments } from "@/lib/db/schema";
import { TERMINAL_STATUSES } from "@/lib/shipments/status";
import type { ShipmentListQuery } from "@/lib/validation/shipment";

export async function listShipments(query: Partial<ShipmentListQuery> = {}) {
  const db = getDb();
  const clauses: SQL[] = [];

  if (query.status?.length) {
    clauses.push(inArray(shipments.status, query.status));
  }

  if (query.active === true) {
    clauses.push(eq(shipments.archived, false));
    clauses.push(notInArray(shipments.status, [...TERMINAL_STATUSES]));
  } else if (query.active === false) {
    clauses.push(
      or(
        eq(shipments.archived, true),
        inArray(shipments.status, [...TERMINAL_STATUSES]),
      )!,
    );
  }

  if (query.updatedSince) {
    clauses.push(gte(shipments.updatedAt, query.updatedSince));
  }

  const where = clauses.length ? and(...clauses) : undefined;
  const rows = await db
    .select()
    .from(shipments)
    .where(where)
    .orderBy(desc(shipments.updatedAt));

  return rows;
}

export async function getShipmentById(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.id, id))
    .limit(1);
  return row ?? null;
}

export async function getShipmentByExternalKey(externalKey: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.externalKey, externalKey))
    .limit(1);
  return row ?? null;
}

export async function listEvents(shipmentId: string) {
  const db = getDb();
  return db
    .select()
    .from(shipmentEvents)
    .where(eq(shipmentEvents.shipmentId, shipmentId))
    .orderBy(desc(shipmentEvents.at));
}
