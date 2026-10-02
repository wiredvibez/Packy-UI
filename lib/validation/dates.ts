import { z } from "zod";

function toDate(value: Date | string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("invalid_date");
  }
  return date;
}

export const dateInput = z
  .union([
    z.date(),
    z.iso.datetime({ offset: true }),
    z.iso.datetime(),
    z.iso.date(),
    z.string().min(8).max(40),
  ])
  .transform((value, ctx) => {
    try {
      return toDate(value);
    } catch {
      ctx.addIssue({ code: "custom", message: "invalid_date" });
      return z.NEVER;
    }
  });

export const optionalDateInput = z
  .union([dateInput, z.null(), z.literal("")])
  .optional()
  .transform((value) => {
    if (value === undefined || value === "" || value === null) {
      return value === null ? null : undefined;
    }
    return value;
  });
