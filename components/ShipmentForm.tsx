import type { ShipmentRow } from "@/lib/db/schema";
import { SHIPMENT_STATUSES, STATUS_LABELS_HE } from "@/lib/shipments/status";
import { formatIsraelInput } from "@/lib/time/israel";

function toLocalInput(value: Date | null | undefined): string {
  if (!value) return "";
  return formatIsraelInput(value);
}

export function ShipmentForm({
  shipment,
  action,
  submitLabel,
}: {
  shipment?: ShipmentRow;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  const itemsText = (shipment?.items ?? [])
    .map((item) => (item.qty ? `${item.name} | ${item.qty}` : item.name))
    .join("\n");
  const linksText = (shipment?.links ?? [])
    .map((link) => `${link.label} | ${link.url} | ${link.kind}`)
    .join("\n");

  return (
    <form action={action} className="space-y-4">
      {shipment ? <input type="hidden" name="id" value={shipment.id} /> : null}

      <Field label="כותרת" name="title" defaultValue={shipment?.title} required />
      <Field label="חנות" name="merchant" defaultValue={shipment?.merchant ?? ""} />
      <Field
        label="מפתח חיצוני"
        name="externalKey"
        defaultValue={shipment?.externalKey ?? ""}
        hint="יציב לסוכן. ריק ביצירה ידנית יקבל מפתח אוטומטי."
      />

      <label className="block">
        <span className="mb-1 block text-sm font-medium">סטטוס</span>
        <select
          name="status"
          defaultValue={shipment?.status ?? "ordered"}
          className="field"
        >
          {SHIPMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS_HE[status]}
            </option>
          ))}
        </select>
      </label>

      <Field
        label="פירוט סטטוס"
        name="statusDetail"
        defaultValue={shipment?.statusDetail ?? ""}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="חברה" name="carrier" defaultValue={shipment?.carrier ?? ""} />
        <Field
          label="מספר מעקב"
          name="trackingNumber"
          defaultValue={shipment?.trackingNumber ?? ""}
        />
      </div>
      <Field
        label="קישור מעקב"
        name="trackingUrl"
        defaultValue={shipment?.trackingUrl ?? ""}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="מספר הזמנה"
          name="orderNumber"
          defaultValue={shipment?.orderNumber ?? ""}
        />
        <Field
          label="תאריך הזמנה"
          name="orderDate"
          type="datetime-local"
          defaultValue={toLocalInput(shipment?.orderDate)}
        />
      </div>
      <Field
        label="ETA"
        name="eta"
        type="datetime-local"
        defaultValue={toLocalInput(shipment?.eta)}
      />
      <Field
        label="כתובת מסירה"
        name="deliveryAddress"
        defaultValue={shipment?.deliveryAddress ?? ""}
      />
      <Field
        label="נקודת איסוף"
        name="pickupLocation"
        defaultValue={shipment?.pickupLocation ?? ""}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="קוד איסוף"
          name="pickupCode"
          defaultValue={shipment?.pickupCode ?? ""}
        />
        <Field
          label="דדליין איסוף"
          name="pickupDeadline"
          type="datetime-local"
          defaultValue={toLocalInput(shipment?.pickupDeadline)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="עלות"
          name="cost"
          type="number"
          defaultValue={shipment?.cost ?? ""}
        />
        <Field
          label="מטבע"
          name="currency"
          defaultValue={shipment?.currency ?? "ILS"}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="needsAction"
          defaultChecked={shipment?.needsAction}
          className="size-4 accent-sage"
        />
        צריך טיפול
      </label>
      <Field
        label="הערת טיפול"
        name="actionNote"
        defaultValue={shipment?.actionNote ?? ""}
      />
      <Field
        label="חשבון מקור"
        name="sourceAccount"
        defaultValue={shipment?.sourceAccount ?? ""}
      />
      <label className="block">
        <span className="mb-1 block text-sm font-medium">פריטים</span>
        <textarea
          name="itemsText"
          defaultValue={itemsText}
          rows={3}
          className="field min-h-20"
          placeholder={"אוזניות | 1\nכיסוי"}
        />
        <span className="mt-1 block text-xs text-ink-muted">
          שורה לפריט. אפשר: שם | כמות
        </span>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">קישורים</span>
        <textarea
          name="linksText"
          defaultValue={linksText}
          rows={3}
          className="field min-h-20"
          placeholder="אימייל | https://mail.google.com/... | email"
        />
        <span className="mt-1 block text-xs text-ink-muted">
          תווית | כתובת | email/order/tracking/message/other
        </span>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">הערות</span>
        <textarea
          name="notes"
          defaultValue={shipment?.notes ?? ""}
          rows={3}
          className="field min-h-20"
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-2xl bg-sage px-4 py-3 font-semibold text-paper-2"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="field"
        step={type === "number" ? "0.01" : undefined}
      />
      {hint ? <span className="mt-1 block text-xs text-ink-muted">{hint}</span> : null}
    </label>
  );
}
