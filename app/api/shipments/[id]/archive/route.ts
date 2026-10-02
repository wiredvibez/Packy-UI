import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api/errors";
import { requireIngestKey } from "@/lib/api/guard";
import { getDb } from "@/lib/db";
import { shipments } from "@/lib/db/schema";
import { getShipmentById } from "@/lib/shipments/queries";
import { serializeShipment } from "@/lib/shipments/serialize";
import { isUuid } from "@/lib/validation/id";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const denied = await requireIngestKey(request);
  if (denied) return denied;

  const { id } = await context.params;
  if (!isUuid(id)) {
    return jsonError(404, "not_found");
  }
  try {
    const existing = await getShipmentById(id);
    if (!existing) {
      return jsonError(404, "not_found");
    }

    const db = getDb();
    const [updated] = await db
      .update(shipments)
      .set({ archived: true, updatedAt: new Date() })
      .where(eq(shipments.id, id))
      .returning();
    return Response.json({ shipment: serializeShipment(updated) });
  } catch (error) {
    console.error("POST /api/shipments/:id/archive failed", error);
    return jsonError(500, "database_error");
  }
}
