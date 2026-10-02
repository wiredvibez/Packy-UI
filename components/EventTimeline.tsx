import type { ShipmentEventRow } from "@/lib/db/schema";
import { STATUS_LABELS_HE } from "@/lib/shipments/status";
import { formatDateTimeHe, relativeTimeHe } from "@/lib/time/hebrew";

export function EventTimeline({ events }: { events: ShipmentEventRow[] }) {
  if (!events.length) {
    return (
      <p className="rounded-2xl bg-paper px-4 py-5 text-sm text-ink-muted">
        עדיין אין אירועי מעקב למשלוח הזה.
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 border-s-2 border-line ps-4">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span className="absolute top-1.5 -start-[1.4rem] size-2.5 rounded-full bg-sage" />
          <p className="text-sm font-medium">
            {event.status ? STATUS_LABELS_HE[event.status] : "עדכון"}
            {event.location ? ` · ${event.location}` : ""}
          </p>
          {event.description ? (
            <p className="mt-0.5 text-sm text-ink-muted">{event.description}</p>
          ) : null}
          <p className="mt-1 text-xs text-ink-muted">
            {formatDateTimeHe(event.at)} · {relativeTimeHe(event.at)}
            {event.source ? ` · ${event.source}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
