import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { jsonError, readJsonBody, zodErrorResponse } from "@/lib/api/errors";
import { requireIngestKey, requireSessionOrIngest } from "@/lib/api/guard";
import { getDb } from "@/lib/db";
import { shipments } from "@/lib/db/schema";
import { getShipmentById, listEvents } from "@/lib/shipments/queries";
import { serializeEvent, serializeShipment } from "@/lib/shipments/serialize";
import { toUpdateSet } from "@/lib/shipments/upsert";
import { isUuid } from "@/lib/validation/id";
import { shipmentPatchSchema } from "@/lib/validation/shipment";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const denied = await requireSessionOrIngest(request);
  if (denied) return denied;

  const { id } = await context.params;
  if (!isUuid(id)) {
    return jsonError(404, "not_found");
  }
  try {
    const shipment = await getShipmentById(id);
    if (!shipment) {
      return jsonError(404, "not_found");
    }
    const events = await listEvents(id);
    return Response.json({
      shipment: serializeShipment(shipment),
      events: events.map(serializeEvent),
    });
  } catch (error) {
    console.error("GET /api/shipments/:id failed", error);
    return jsonError(500, "database_error");
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const denied = await requireIngestKey(request);
  if (denied) return denied;

  const { id } = await context.params;
  if (!isUuid(id)) {
    return jsonError(404, "not_found");
  }
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = shipmentPatchSchema.safeParse(body.data);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  try {
    const existing = await getShipmentById(id);
    if (!existing) {
      return jsonError(404, "not_found");
    }

    const db = getDb();
    const [updated] = await db
      .update(shipments)
      .set(toUpdateSet(parsed.data))
      .where(eq(shipments.id, id))
      .returning();
    return Response.json({ shipment: serializeShipment(updated) });
  } catch (error) {
    console.error("PATCH /api/shipments/:id failed", error);
    return jsonError(500, "database_error");
  }
}
