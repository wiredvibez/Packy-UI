import {
  STATUS_LABELS_HE,
  STATUS_TONE,
  type ShipmentStatus,
} from "@/lib/shipments/status";

const TONE_CLASS: Record<(typeof STATUS_TONE)[ShipmentStatus], string> = {
  neutral: "bg-line/60 text-ink",
  info: "bg-sky-soft text-sky",
  warn: "bg-amber-soft text-amber",
  pickup: "bg-violet-soft text-violet",
  ok: "bg-ok-soft text-ok",
  danger: "bg-rose-soft text-rose",
  muted: "bg-line/70 text-ink-muted",
};

export function StatusChip({ status }: { status: ShipmentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASS[STATUS_TONE[status]]}`}
    >
      {STATUS_LABELS_HE[status]}
    </span>
  );
}
