import { z } from "zod";
import { LINK_KINDS, SHIPMENT_STATUSES } from "@/lib/shipments/status";
import { dateInput, optionalDateInput } from "@/lib/validation/dates";
import { httpUrlSchema } from "@/lib/validation/url";

export const shipmentItemSchema = z.object({
  name: z.string().trim().min(1).max(300),
  qty: z.number().positive().max(10_000).optional(),
  price: z.number().nonnegative().max(1_000_000_000).optional(),
  image: httpUrlSchema.optional(),
});

export const shipmentLinkSchema = z.object({
  label: z.string().trim().min(1).max(120),
  url: httpUrlSchema,
  kind: z.enum(LINK_KINDS),
});

const optionalText = z.string().trim().max(2000).nullable().optional();
const optionalShort = z.string().trim().max(300).nullable().optional();

export const shipmentWriteSchema = z.object({
  externalKey: z.string().trim().min(1).max(400),
  title: z.string().trim().min(1).max(300),
  merchant: optionalShort,
  items: z.array(shipmentItemSchema).max(200).optional(),
  orderNumber: optionalShort,
  orderDate: optionalDateInput,
  carrier: optionalShort,
  trackingNumber: optionalShort,
  trackingUrl: httpUrlSchema.nullable().optional(),
  status: z.enum(SHIPMENT_STATUSES).optional(),
  statusDetail: optionalText,
  eta: optionalDateInput,
  etaStart: optionalDateInput,
  etaEnd: optionalDateInput,
  pickupLocation: optionalText,
  pickupCode: optionalShort,
  pickupDeadline: optionalDateInput,
  deliveryAddress: optionalText,
  cost: z.number().nonnegative().max(1_000_000_000).nullable().optional(),
  currency: z.string().trim().max(8).nullable().optional(),
  needsAction: z.boolean().optional(),
  actionNote: optionalText,
  links: z.array(shipmentLinkSchema).max(50).optional(),
  sourceAccount: optionalShort,
  notes: optionalText,
  archived: z.boolean().optional(),
});

export const shipmentCreateSchema = shipmentWriteSchema;

export const shipmentPatchSchema = shipmentWriteSchema
  .partial()
  .omit({ externalKey: true })
  .extend({
    externalKey: z.string().trim().min(1).max(400).optional(),
  });

export const shipmentEventSchema = z.object({
  at: dateInput,
  status: z.enum(SHIPMENT_STATUSES).optional(),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(300).optional(),
  source: z.string().trim().max(120).optional(),
});

export const shipmentListQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean)
        : undefined,
    )
    .pipe(z.array(z.enum(SHIPMENT_STATUSES)).max(20).optional()),
  active: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((value) => {
      if (value === "true" || value === "1") return true;
      if (value === "false" || value === "0") return false;
      return undefined;
    }),
  updatedSince: optionalDateInput,
});

export type ShipmentWriteInput = z.infer<typeof shipmentWriteSchema>;
export type ShipmentPatchInput = z.infer<typeof shipmentPatchSchema>;
export type ShipmentEventInput = z.infer<typeof shipmentEventSchema>;
export type ShipmentListQuery = z.infer<typeof shipmentListQuerySchema>;
