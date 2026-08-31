import { authorizeAgent, unauthorized } from "@/lib/agentAuth";
import * as store from "@/lib/store";

export const runtime = "nodejs";

// Read-only project index so the /worklog skill can resolve and verify a
// trackerProjectId against real projects instead of guessing — which is what
// keeps it attaching work to existing projects rather than proposing new ones.
export async function GET(req: Request) {
  if (!authorizeAgent(req)) return unauthorized();

  const entities = await store.getEntities();
  const entityName = new Map(entities.map((e) => [e.id, e.name]));
  const projects = await store.getProjects();

  return Response.json({
    ok: true,
    projects: projects
      .filter((p) => p.status !== "archived")
      .map((p) => ({
        id: p.id,
        title: p.title,
        entity: entityName.get(p.entityId) || p.entityId,
        status: p.status,
        triage: p.triage,
        gated: !!p.gated,
        openTasks: p.tasks.filter((t) => !t.done).map((t) => ({ id: t.id, title: t.title })),
        phases: Array.from(
          new Set((p.sessionLogs || []).map((l) => l.phase).filter(Boolean))
        ),
        logCount: (p.sessionLogs || []).length,
      })),
  });
}
