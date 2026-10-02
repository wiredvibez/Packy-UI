import { NextRequest } from "next/server";
import { jsonError, readJsonBody, zodErrorResponse } from "@/lib/api/errors";
import { requireIngestKey } from "@/lib/api/guard";
import { appendShipmentEvent } from "@/lib/shipments/append-event";
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
    const saved = await appendShipmentEvent({
      shipmentId: id,
      at: parsed.data.at,
      status: parsed.data.status,
      description: parsed.data.description,
      location: parsed.data.location,
      source: parsed.data.source,
    });
    if (!saved) {
      return jsonError(404, "not_found");
    }
    return Response.json(
      {
        event: serializeEvent(saved.event),
        shipment: serializeShipment(saved.shipment),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/shipments/:id/events failed", error);
    return jsonError(500, "database_error");
  }
}
