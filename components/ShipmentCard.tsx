import Link from "next/link";
import type { ShipmentRow } from "@/lib/db/schema";
import { arrivalDate } from "@/lib/shipments/arrival";
import { normalizeHttpUrl } from "@/lib/validation/url";
import { formatDateHe, formatWindowHe, relativeTimeHe } from "@/lib/time/hebrew";
import { CopyButton } from "@/components/CopyButton";
import { LinkButtons } from "@/components/LinkButtons";
import { StatusChip } from "@/components/StatusChip";

export function ShipmentCard({ shipment }: { shipment: ShipmentRow }) {
  const when = arrivalDate(shipment);
  const etaLabel =
    shipment.etaStart || shipment.etaEnd
      ? formatWindowHe(shipment.etaStart, shipment.etaEnd)
      : formatDateHe(when);
  const relative = relativeTimeHe(when);
  const trackingHref = normalizeHttpUrl(shipment.trackingUrl);
  const emailLinks = (shipment.links ?? []).filter(
    (link) => link.kind === "email" || link.kind === "message",
  );
  const orderLinks = (shipment.links ?? []).filter((link) => link.kind === "order");

  return (
    <article className="rounded-3xl border border-line bg-paper-2 p-4 shadow-[0_10px_30px_-24px_rgba(29,26,22,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-muted">
            {shipment.merchant ?? "ללא חנות"}
          </p>
          <Link
            href={`/shipments/${shipment.id}`}
            className="mt-0.5 block truncate text-base font-semibold"
          >
            {shipment.title}
          </Link>
        </div>
        <StatusChip status={shipment.status} />
      </div>

      <div className="mt-3 space-y-1 text-sm text-ink-muted">
        {shipment.status === "at_pickup_point" && shipment.pickupLocation ? (
          <p>איסוף: {shipment.pickupLocation}</p>
        ) : null}
        {etaLabel ? (
          <p>
            {shipment.status === "at_pickup_point" ? "לאיסוף עד " : "צפוי "}
            {etaLabel}
            {relative ? ` · ${relative}` : ""}
          </p>
        ) : (
          <p>אין תאריך הגעה עדיין</p>
        )}
        {shipment.statusDetail ? <p>{shipment.statusDetail}</p> : null}
      </div>

      {shipment.pickupCode ? (
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-violet-soft/70 px-3 py-2">
          <div>
            <p className="text-xs text-violet">קוד איסוף</p>
            <p className="font-mono text-lg font-semibold tracking-wide">
              {shipment.pickupCode}
            </p>
          </div>
          <CopyButton value={shipment.pickupCode} label="העתק קוד" />
        </div>
      ) : null}

      {shipment.trackingNumber ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-muted">{shipment.carrier ?? "משלוח"}</span>
          <CopyButton value={shipment.trackingNumber} compact />
          {trackingHref ? (
            <a
              href={trackingHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-sky-soft px-3 py-1 font-medium text-sky"
            >
              פתח מעקב
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3">
        <LinkButtons links={[...emailLinks, ...orderLinks]} />
      </div>
    </article>
  );
}
