import Link from "next/link";
import * as store from "@/lib/store";
import { auth } from "@/auth";
import {
  ENTITY_COLOR_HEX,
  PROJECT_TYPE_LABELS,
  TRIAGE_LABELS,
  TriageBucket,
} from "@/lib/types";
import { setTriageAction } from "@/lib/actions";

const BUCKETS: TriageBucket[] = ["now", "next", "waiting", "someday"];

// "Now" is the one bucket that earns the rare oxblood emphasis — everything
// else stays navy so the accent doesn't get diluted into decoration.
const BUCKET_ACCENT: Record<TriageBucket, string> = {
  now: "text-oxblood",
  next: "text-navy",
  waiting: "text-navy",
  someday: "text-charcoal/50",
};

export default async function DashboardPage() {
  const session = await auth();
  const allowed = await store.getAllowedEntityIds(session?.user?.email);

  const [allEntities, allProjects] = await Promise.all([
    store.getEntities(),
    store.getProjects(),
  ]);

  const entities = allowed === "all" ? allEntities : allEntities.filter((e) => allowed.includes(e.id));
  const projects =
    allowed === "all" ? allProjects : allProjects.filter((p) => allowed.includes(p.entityId));

  const entityById = Object.fromEntries(entities.map((e) => [e.id, e]));
  const live = projects.filter((p) => p.status !== "done" && p.status !== "archived");

  if (entities.length === 0) {
    return (
      <div className="card p-10 text-center space-y-3">
        <p className="label">No entities yet.</p>
        <p className="text-charcoal">
          Start by adding a business, venture, or your personal creative lane.
        </p>
        <Link href="/entities" className="btn-primary inline-flex mt-2">
          Set up entities
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="hero text-2xl">Triage</h1>
        <span className="label">{live.length} active across {entities.length} entities</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {BUCKETS.map((bucket) => {
          const items = live.filter((p) => p.triage === bucket);
          return (
            <div key={bucket} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className={`label ${BUCKET_ACCENT[bucket]}`}>{TRIAGE_LABELS[bucket]}</h2>
                <span className="text-xs text-charcoal/50 font-structural">{items.length}</span>
              </div>
              <div className="space-y-2 min-h-[4rem]">
                {items.length === 0 && (
                  <p className="text-xs text-charcoal/40 font-structural italic px-1">empty</p>
                )}
                {items.map((p) => {
                  const entity = entityById[p.entityId];
                  return (
                    <div key={p.id} className="card p-3 space-y-2 group">
                      <Link href={`/projects/${p.id}`} className="block">
                        <div
                          className="text-[10px] uppercase tracking-wider font-structural mb-1"
                          style={{ color: entity ? ENTITY_COLOR_HEX[entity.color] : undefined }}
                        >
                          {entity?.name || "—"}
                        </div>
                        <div className="text-sm text-charcoal group-hover:text-navy transition-colors">
                          {p.title}
                        </div>
                        <div className="text-xs text-charcoal/50 mt-1">
                          {PROJECT_TYPE_LABELS[p.type]}
                          {p.dueDate ? ` · due ${p.dueDate}` : ""}
                        </div>
                      </Link>
                      <div className="flex gap-1 pt-1 border-t border-line">
                        {BUCKETS.filter((b) => b !== bucket).map((b) => (
                          <form action={setTriageAction} key={b}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="triage" value={b} />
                            <button
                              type="submit"
                              className="text-[10px] font-structural text-charcoal/50 hover:text-navy px-1"
                              title={`Move to ${TRIAGE_LABELS[b]}`}
                            >
                              → {TRIAGE_LABELS[b].split(" ")[0]}
                            </button>
                          </form>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
