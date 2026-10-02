import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveManualShipment } from "@/lib/actions/shipments";
import { AppHeader } from "@/components/AppHeader";
import { CopyButton } from "@/components/CopyButton";
import { EventTimeline } from "@/components/EventTimeline";
import { LinkButtons } from "@/components/LinkButtons";
import { StatusChip } from "@/components/StatusChip";
import { requirePageSession } from "@/lib/auth/session";
import { getShipmentById, listEvents } from "@/lib/shipments/queries";
import { isUuid } from "@/lib/validation/id";
import { normalizeHttpUrl } from "@/lib/validation/url";
import {
  formatDateHe,
  formatDateTimeHe,
  formatWindowHe,
  relativeTimeHe,
} from "@/lib/time/hebrew";

export const dynamic = "force-dynamic";

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageSession();
  const { id } = await params;
  if (!isUuid(id)) {
    notFound();
  }
  const shipment = await getShipmentById(id);
  if (!shipment) {
    notFound();
  }
  const events = await listEvents(id);
  const trackingHref = normalizeHttpUrl(shipment.trackingUrl);

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink-muted">
              {shipment.merchant ?? "ללא חנות"}
            </p>
            <h1 className="text-2xl font-semibold leading-tight">
              {shipment.title}
            </h1>
          </div>
          <StatusChip status={shipment.status} />
        </div>

        {shipment.statusDetail ? (
          <p className="text-sm text-ink-muted">{shipment.statusDetail}</p>
        ) : null}

        <section className="space-y-2 rounded-3xl border border-line bg-paper-2 p-4 text-sm">
          <Row
            label="הגעה"
            value={
              formatWindowHe(shipment.etaStart, shipment.etaEnd) ??
              formatDateHe(shipment.eta) ??
              "לא ידוע"
            }
          />
          {shipment.eta ? (
            <Row label="יחסית" value={relativeTimeHe(shipment.eta) ?? ""} />
          ) : null}
          {shipment.orderNumber ? (
            <Row label="הזמנה" value={shipment.orderNumber} />
          ) : null}
          {shipment.orderDate ? (
            <Row label="תאריך הזמנה" value={formatDateHe(shipment.orderDate) ?? ""} />
          ) : null}
          {shipment.cost != null ? (
            <Row
              label="עלות"
              value={`${shipment.cost} ${shipment.currency ?? ""}`.trim()}
            />
          ) : null}
          {shipment.deliveryAddress ? (
            <Row label="כתובת" value={shipment.deliveryAddress} />
          ) : null}
          {shipment.sourceAccount ? (
            <Row label="חשבון" value={shipment.sourceAccount} />
          ) : null}
          {shipment.notes ? <Row label="הערות" value={shipment.notes} /> : null}
        </section>

        {shipment.pickupCode || shipment.pickupLocation || shipment.pickupDeadline ? (
          <section className="rounded-3xl bg-violet-soft/70 p-4">
            <p className="text-sm font-semibold text-violet">איסוף</p>
            {shipment.pickupLocation ? (
              <p className="mt-1">{shipment.pickupLocation}</p>
            ) : null}
            {shipment.pickupDeadline ? (
              <p className="text-sm text-ink-muted">
                עד {formatDateTimeHe(shipment.pickupDeadline)} ·{" "}
                {relativeTimeHe(shipment.pickupDeadline)}
              </p>
            ) : null}
            {shipment.pickupCode ? (
              <div className="mt-3 flex items-center justify-between">
                <p className="font-mono text-2xl font-semibold">
                  {shipment.pickupCode}
                </p>
                <CopyButton value={shipment.pickupCode} label="העתק קוד" />
              </div>
            ) : null}
          </section>
        ) : null}

        {shipment.trackingNumber ? (
          <section className="flex flex-wrap items-center gap-2 rounded-3xl border border-line bg-paper-2 p-4">
            <span className="text-sm text-ink-muted">
              {shipment.carrier ?? "משלוח"}
            </span>
            <CopyButton value={shipment.trackingNumber} compact />
            {trackingHref ? (
              <a
                href={trackingHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-sky-soft px-3 py-1 text-sm font-medium text-sky"
              >
                פתח מעקב
              </a>
            ) : null}
          </section>
        ) : null}

        {(shipment.items ?? []).length > 0 ? (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-ink-muted">פריטים</h2>
            <ul className="space-y-2">
              {shipment.items.map((item) => {
                const imageHref = normalizeHttpUrl(item.image);
                return (
                <li
                  key={`${item.name}-${item.qty ?? 0}`}
                  className="flex items-center justify-between rounded-2xl bg-paper-2 px-3 py-2 text-sm"
                >
                  <span>{item.name}</span>
                  <span className="text-ink-muted">
                    {item.qty ? `×${item.qty}` : ""}
                    {item.price != null
                      ? ` · ${item.price}${shipment.currency ? ` ${shipment.currency}` : ""}`
                      : ""}
                    {imageHref ? (
                      <>
                        {" · "}
                        <a
                          href={imageHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky"
                        >
                          תמונה
                        </a>
                      </>
                    ) : null}
                  </span>
                </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink-muted">קישורים</h2>
          <LinkButtons links={shipment.links ?? []} />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink-muted">ציר זמן</h2>
          <EventTimeline events={events} />
        </section>

        <div className="flex gap-2">
          <Link
            href={`/shipments/${shipment.id}/edit`}
            className="flex-1 rounded-2xl bg-paper-2 px-4 py-3 text-center font-semibold"
          >
            עריכה
          </Link>
          {!shipment.archived ? (
            <form action={archiveManualShipment} className="flex-1">
              <input type="hidden" name="id" value={shipment.id} />
              <button
                type="submit"
                className="w-full rounded-2xl bg-line/70 px-4 py-3 font-semibold"
              >
                העבר לארכיון
              </button>
            </form>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-ink-muted">{label}</span>
      <span className="text-end">{value}</span>
    </div>
  );
}
