import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  SHIPMENT_STATUSES,
  type ShipmentItem,
  type ShipmentLink,
} from "../shipments/status";

export const shipmentStatusEnum = pgEnum("shipment_status", [
  ...SHIPMENT_STATUSES,
]);

export const shipments = pgTable(
  "shipments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    externalKey: text("external_key").notNull().unique(),
    title: text("title").notNull(),
    merchant: text("merchant"),
    items: jsonb("items").$type<ShipmentItem[]>().notNull().default([]),
    orderNumber: text("order_number"),
    orderDate: timestamp("order_date", { withTimezone: true }),
    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    trackingUrl: text("tracking_url"),
    status: shipmentStatusEnum("status").notNull().default("ordered"),
    statusDetail: text("status_detail"),
    eta: timestamp("eta", { withTimezone: true }),
    etaStart: timestamp("eta_start", { withTimezone: true }),
    etaEnd: timestamp("eta_end", { withTimezone: true }),
    pickupLocation: text("pickup_location"),
    pickupCode: text("pickup_code"),
    pickupDeadline: timestamp("pickup_deadline", { withTimezone: true }),
    deliveryAddress: text("delivery_address"),
    cost: numeric("cost", { precision: 12, scale: 2 }),
    currency: text("currency").default("ILS"),
    needsAction: boolean("needs_action").notNull().default(false),
    actionNote: text("action_note"),
    links: jsonb("links").$type<ShipmentLink[]>().notNull().default([]),
    sourceAccount: text("source_account"),
    notes: text("notes"),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("shipments_status_idx").on(table.status),
    index("shipments_archived_idx").on(table.archived),
    index("shipments_updated_at_idx").on(table.updatedAt),
    index("shipments_needs_action_idx").on(table.needsAction),
    index("shipments_eta_idx").on(table.eta),
    index("shipments_pickup_deadline_idx").on(table.pickupDeadline),
  ],
);

export const shipmentEvents = pgTable(
  "shipment_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shipmentId: uuid("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    at: timestamp("at", { withTimezone: true }).notNull(),
    status: shipmentStatusEnum("status"),
    description: text("description"),
    location: text("location"),
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("shipment_events_shipment_id_idx").on(table.shipmentId),
    index("shipment_events_at_idx").on(table.at),
  ],
);

export const shipmentsRelations = relations(shipments, ({ many }) => ({
  events: many(shipmentEvents),
}));

export const shipmentEventsRelations = relations(shipmentEvents, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentEvents.shipmentId],
    references: [shipments.id],
  }),
}));

export type ShipmentRow = typeof shipments.$inferSelect;
export type NewShipmentRow = typeof shipments.$inferInsert;
export type ShipmentEventRow = typeof shipmentEvents.$inferSelect;
export type NewShipmentEventRow = typeof shipmentEvents.$inferInsert;
