CREATE TYPE "public"."shipment_status" AS ENUM('ordered', 'processing', 'shipped', 'in_transit', 'customs', 'out_for_delivery', 'at_pickup_point', 'delivered', 'failed_attempt', 'exception', 'returned', 'cancelled');--> statement-breakpoint
CREATE TABLE "shipment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"status" "shipment_status",
	"description" text,
	"location" text,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_key" text NOT NULL,
	"title" text NOT NULL,
	"merchant" text,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"order_number" text,
	"order_date" timestamp with time zone,
	"carrier" text,
	"tracking_number" text,
	"tracking_url" text,
	"status" "shipment_status" DEFAULT 'ordered' NOT NULL,
	"status_detail" text,
	"eta" timestamp with time zone,
	"eta_start" timestamp with time zone,
	"eta_end" timestamp with time zone,
	"pickup_location" text,
	"pickup_code" text,
	"pickup_deadline" timestamp with time zone,
	"delivery_address" text,
	"cost" numeric(12, 2),
	"currency" text DEFAULT 'ILS',
	"needs_action" boolean DEFAULT false NOT NULL,
	"action_note" text,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_account" text,
	"notes" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipments_external_key_unique" UNIQUE("external_key")
);
--> statement-breakpoint
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shipment_events_shipment_id_idx" ON "shipment_events" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "shipment_events_at_idx" ON "shipment_events" USING btree ("at");--> statement-breakpoint
CREATE INDEX "shipments_status_idx" ON "shipments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shipments_archived_idx" ON "shipments" USING btree ("archived");--> statement-breakpoint
CREATE INDEX "shipments_updated_at_idx" ON "shipments" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "shipments_needs_action_idx" ON "shipments" USING btree ("needs_action");--> statement-breakpoint
CREATE INDEX "shipments_eta_idx" ON "shipments" USING btree ("eta");--> statement-breakpoint
CREATE INDEX "shipments_pickup_deadline_idx" ON "shipments" USING btree ("pickup_deadline");