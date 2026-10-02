import { NextRequest } from "next/server";
import { jsonError, readJsonBody, zodErrorResponse } from "@/lib/api/errors";
import { requireIngestKey, requireSessionOrIngest } from "@/lib/api/guard";
import { getDb } from "@/lib/db";
import { shipments } from "@/lib/db/schema";
import { listShipments } from "@/lib/shipments/queries";
import { serializeShipment } from "@/lib/shipments/serialize";
import { toInsertValues, toUpdateSet } from "@/lib/shipments/upsert";
import {
  shipmentCreateSchema,
  shipmentListQuerySchema,
} from "@/lib/validation/shipment";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireSessionOrIngest(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const parsed = shipmentListQuerySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    active: url.searchParams.get("active") ?? undefined,
    updatedSince: url.searchParams.get("updatedSince") ?? undefined,
  });
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  try {
    const rows = await listShipments(parsed.data);
    return Response.json({ shipments: rows.map(serializeShipment) });
  } catch (error) {
    console.error("GET /api/shipments failed", error);
    return jsonError(500, "database_error");
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireIngestKey(request);
  if (denied) return denied;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = shipmentCreateSchema.safeParse(body.data);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  try {
    const db = getDb();
    const [row] = await db
      .insert(shipments)
      .values(toInsertValues(parsed.data))
      .onConflictDoUpdate({
        target: shipments.externalKey,
        set: toUpdateSet(parsed.data),
      })
      .returning();

    if (!row) {
      return jsonError(500, "database_error");
    }

    const created = row.createdAt.getTime() === row.updatedAt.getTime();
    return Response.json(
      { shipment: serializeShipment(row), created },
      { status: created ? 201 : 200 },
    );
  } catch (error) {
    console.error("POST /api/shipments failed", error);
    return jsonError(500, "database_error");
  }
}
