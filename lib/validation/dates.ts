import { z } from "zod";

/**
 * Agent timestamps must say which zone they are.
 * Offset-less datetimes are rejected so Vercel (UTC) cannot shift Israel
 * wall times by 2–3 hours. A plain date is UTC midnight.
 */
export const dateInput = z
  .union([z.iso.datetime({ offset: true }), z.iso.date()])
  .transform((value) => new Date(value));

export const optionalDateInput = z
  .union([dateInput, z.null(), z.literal("")])
  .optional()
  .transform((value) => {
    if (value === undefined || value === "" || value === null) {
      return value === null ? null : undefined;
    }
    return value;
  });
