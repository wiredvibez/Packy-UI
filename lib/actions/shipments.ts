"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db/errors";
import { shipments } from "@/lib/db/schema";
import { parseLinkText } from "@/lib/shipments/links";
import { israelWallTimeToDate } from "@/lib/time/israel";
import { normalizeHttpUrl } from "@/lib/validation/url";
import { SHIPMENT_STATUSES } from "@/lib/shipments/status";
import { getShipmentById } from "@/lib/shipments/queries";
import { costToNumeric } from "@/lib/shipments/upsert";

function asString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function asOptional(formData: FormData, key: string): string | null {
  const value = asString(formData, key);
  return value ? value : null;
}

function asDate(formData: FormData, key: string): Date | null {
  const value = asOptional(formData, key);
  if (!value) return null;
  return israelWallTimeToDate(value);
}

function asUrl(formData: FormData, key: string): string | null {
  return normalizeHttpUrl(asOptional(formData, key));
}

function asBool(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

function parseItems(formData: FormData) {
  const raw = asOptional(formData, "itemsText");
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, qty] = line.split("|").map((part) => part.trim());
      const quantity = qty ? Number(qty) : undefined;
      return {
        name,
        qty: quantity && Number.isFinite(quantity) ? quantity : undefined,
      };
    });
}

function parseLinks(formData: FormData) {
  const raw = asOptional(formData, "linksText");
  if (!raw) return [];
  return parseLinkText(raw);
}

function formToValues(formData: FormData) {
  const statusRaw = asString(formData, "status") || "ordered";
  const status = SHIPMENT_STATUSES.includes(
    statusRaw as (typeof SHIPMENT_STATUSES)[number],
  )
    ? (statusRaw as (typeof SHIPMENT_STATUSES)[number])
    : "ordered";

  const costRaw = asOptional(formData, "cost");
  const costNumber = costRaw ? Number(costRaw) : null;

  return {
    title: asString(formData, "title") || "משלוח",
    merchant: asOptional(formData, "merchant"),
    orderNumber: asOptional(formData, "orderNumber"),
    orderDate: asDate(formData, "orderDate"),
    carrier: asOptional(formData, "carrier"),
    trackingNumber: asOptional(formData, "trackingNumber"),
    trackingUrl: asUrl(formData, "trackingUrl"),
    status,
    statusDetail: asOptional(formData, "statusDetail"),
    eta: asDate(formData, "eta"),
    pickupLocation: asOptional(formData, "pickupLocation"),
    pickupCode: asOptional(formData, "pickupCode"),
    pickupDeadline: asDate(formData, "pickupDeadline"),
    deliveryAddress: asOptional(formData, "deliveryAddress"),
    cost:
      costNumber != null && Number.isFinite(costNumber) && costNumber >= 0
        ? costToNumeric(costNumber)
        : null,
    currency: asOptional(formData, "currency") ?? "ILS",
    needsAction: asBool(formData, "needsAction"),
    actionNote: asOptional(formData, "actionNote"),
    notes: asOptional(formData, "notes"),
    items: parseItems(formData),
    links: parseLinks(formData),
    sourceAccount: asOptional(formData, "sourceAccount"),
    updatedAt: new Date(),
  };
}

export async function createManualShipment(formData: FormData) {
  await requirePageSession();
  const values = formToValues(formData);
  const externalKey =
    asOptional(formData, "externalKey") ?? `manual:${randomUUID()}`;

  const db = getDb();
  let createdId = "";
  try {
    const [created] = await db
      .insert(shipments)
      .values({
        ...values,
        externalKey,
      })
      .returning();
    createdId = created.id;
  } catch (error) {
    if (isUniqueViolation(error)) {
      redirect("/shipments/new?error=duplicate");
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/archive");
  redirect(`/shipments/${createdId}`);
}

export async function updateManualShipment(formData: FormData) {
  await requirePageSession();
  const id = asString(formData, "id");
  if (!id) {
    redirect("/");
  }
  const existing = await getShipmentById(id);
  if (!existing) {
    redirect("/");
  }

  const values = formToValues(formData);
  const externalKey = asOptional(formData, "externalKey");
  const db = getDb();
  try {
    await db
      .update(shipments)
      .set(externalKey ? { ...values, externalKey } : values)
      .where(eq(shipments.id, id));
  } catch (error) {
    if (isUniqueViolation(error)) {
      redirect(`/shipments/${id}/edit?error=duplicate`);
    }
    throw error;
  }
  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath(`/shipments/${id}`);
  redirect(`/shipments/${id}`);
}

export async function archiveManualShipment(formData: FormData) {
  await requirePageSession();
  const id = asString(formData, "id");
  if (!id) return;
  const db = getDb();
  await db
    .update(shipments)
    .set({ archived: true, updatedAt: new Date() })
    .where(eq(shipments.id, id));
  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath(`/shipments/${id}`);
  redirect("/archive");
}
