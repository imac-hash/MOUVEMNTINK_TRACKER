import { revalidatePath } from "next/cache";
import { authorizeAgent, unauthorized } from "@/lib/agentAuth";
import * as store from "@/lib/store";

export const runtime = "nodejs";

// Machine-writable endpoint used by the /worklog skill to file a session log
// against a project.

function badRequest(message: string) {
  return Response.json({ ok: false, error: message }, { status: 400 });
}

export async function POST(req: Request) {
  if (!authorizeAgent(req)) return unauthorized();

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Body must be JSON.");
  }

  const required = ["id", "projectId", "day", "startedAt", "endedAt", "summary", "filePath"];
  const missing = required.filter((k) => payload?.[k] === undefined || payload[k] === "");
  if (missing.length > 0) {
    return badRequest(`Missing required field(s): ${missing.join(", ")}`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(payload.day))) {
    return badRequest("day must be YYYY-MM-DD.");
  }

  const startedAt = Number(payload.startedAt);
  const endedAt = Number(payload.endedAt);
  if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt)) {
    return badRequest("startedAt and endedAt must be epoch milliseconds.");
  }
  if (endedAt < startedAt) {
    return badRequest("endedAt cannot precede startedAt.");
  }

  const durationMin =
    payload.durationMin !== undefined
      ? Number(payload.durationMin)
      : Math.round((endedAt - startedAt) / 60000);

  const result = await store.upsertSessionLog({
    id: String(payload.id),
    projectId: String(payload.projectId),
    day: String(payload.day),
    startedAt,
    endedAt,
    durationMin,
    phase: payload.phase ? String(payload.phase) : undefined,
    summary: String(payload.summary),
    body: payload.body ? String(payload.body) : undefined,
    tasksTouched: Array.isArray(payload.tasksTouched) ? payload.tasksTouched.map(String) : [],
    filePath: String(payload.filePath),
    repo: payload.repo ? String(payload.repo) : undefined,
    sessionId: payload.sessionId ? String(payload.sessionId) : undefined,
    billable: typeof payload.billable === "boolean" ? payload.billable : undefined,
  });

  if (!result.ok) {
    // No auto-creation. An unknown project is a mapping error in the repo's
    // .claude/worklog.json, not a reason to spawn a project.
    return Response.json(
      {
        ok: false,
        error: `No project with id "${payload.projectId}". Fix trackerProjectId in the repo's .claude/worklog.json — this endpoint never creates projects.`,
      },
      { status: 404 }
    );
  }

  revalidatePath("/", "layout");
  return Response.json({ ok: true, created: result.created });
}
