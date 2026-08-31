import { timingSafeEqual } from "crypto";

// Shared bearer-token check for the /api/agent/* routes. These are called by a
// local CLI (the /worklog skill), which has no browser and so cannot use the
// magic-link session auth the rest of the app relies on.
export function authorizeAgent(req: Request): boolean {
  const expected = process.env.AGENT_API_TOKEN;
  // Fail closed: an unset token disables the endpoints entirely.
  if (!expected) return false;

  const header = req.headers.get("authorization") || "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function unauthorized() {
  return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}
