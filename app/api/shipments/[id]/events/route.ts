import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { jsonError, readJsonBody, zodErrorResponse } from "@/lib/api/errors";
import { requireIngestKey } from "@/lib/api/guard";
import { getDb } from "@/lib/db";
import { shipmentEvents, shipments } from "@/lib/db/schema";
import { getShipmentById } from "@/lib/shipments/queries";
import { serializeEvent, serializeShipment } from "@/lib/shipments/serialize";
import { isUuid } from "@/lib/validation/id";
import { shipmentEventSchema } from "@/lib/validation/shipment";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const denied = await requireIngestKey(request);
  if (denied) return denied;

  const { id } = await context.params;
  if (!isUuid(id)) {
    return jsonError(404, "not_found");
  }
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = shipmentEventSchema.safeParse(body.data);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  try {
    const existing = await getShipmentById(id);
    if (!existing) {
      return jsonError(404, "not_found");
    }

    const db = getDb();
    const [event] = await db
      .insert(shipmentEvents)
      .values({
        shipmentId: id,
        at: parsed.data.at,
        status: parsed.data.status,
        description: parsed.data.description ?? null,
        location: parsed.data.location ?? null,
        source: parsed.data.source ?? null,
      })
      .returning();

    let shipment = existing;
    if (parsed.data.status) {
      const [updated] = await db
        .update(shipments)
        .set({
          status: parsed.data.status,
          updatedAt: new Date(),
        })
        .where(eq(shipments.id, id))
        .returning();
      shipment = updated;
    }

    return Response.json(
      {
        event: serializeEvent(event),
        shipment: serializeShipment(shipment),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/shipments/:id/events failed", error);
    return jsonError(500, "database_error");
  }
}
