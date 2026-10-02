import { ZodError } from "zod";

export function jsonError(status: number, error: string, details?: unknown) {
  return Response.json(
    details === undefined ? { error } : { error, details },
    { status },
  );
}

export function zodErrorResponse(error: ZodError) {
  return jsonError(400, "validation_error", error.flatten());
}

export async function readJsonBody(request: Request): Promise<
  { ok: true; data: unknown } | { ok: false; response: Response }
> {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return { ok: false, response: jsonError(400, "invalid_json") };
  }
}
