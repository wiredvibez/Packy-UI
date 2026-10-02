import { z } from "zod";

/** http(s) only. `javascript:` and `data:` are rejected after URL parsing. */
export function normalizeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  return url.toString();
}

export const httpUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine((value) => normalizeHttpUrl(value) !== null, {
    message: "url must be http or https",
  })
  .transform((value) => normalizeHttpUrl(value) as string);
