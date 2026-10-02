import { format, formatDistanceToNow, isValid } from "date-fns";
import { he } from "date-fns/locale";

export function parseMaybeDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return isValid(date) ? date : null;
}

export function relativeTimeHe(value: Date | string | null | undefined): string | null {
  const date = parseMaybeDate(value);
  if (!date) return null;
  return formatDistanceToNow(date, { addSuffix: true, locale: he });
}

export function formatDateHe(value: Date | string | null | undefined): string | null {
  const date = parseMaybeDate(value);
  if (!date) return null;
  return format(date, "d בMMMM", { locale: he });
}

export function formatDateTimeHe(
  value: Date | string | null | undefined,
): string | null {
  const date = parseMaybeDate(value);
  if (!date) return null;
  return format(date, "d בMMMM, HH:mm", { locale: he });
}

export function formatWindowHe(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
): string | null {
  const a = parseMaybeDate(start);
  const b = parseMaybeDate(end);
  if (a && b) {
    return `${format(a, "d בMMM", { locale: he })} – ${format(b, "d בMMM", { locale: he })}`;
  }
  return formatDateHe(a ?? b);
}
