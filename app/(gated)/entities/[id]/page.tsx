import Link from "next/link";
import { notFound } from "next/navigation";
import * as store from "@/lib/store";
import { auth } from "@/auth";
import { isTeaser, shapeProjectForViewer } from "@/lib/visibility";
import { ENTITY_COLOR_HEX, PROJECT_TYPE_LABELS, TRIAGE_LABELS } from "@/lib/types";
import { deleteEntityAction } from "@/lib/actions";

export default async function EntityPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const isOwner = store.isOwnerEmail(session?.user?.email);
  const allowed = await store.getAllowedEntityIds(session?.user?.email);
  if (allowed !== "all" && !allowed.includes(params.id)) notFound();

  const [entities, projects] = await Promise.all([
    store.getEntities(),
    store.getProjects(),
  ]);
  const entity = entities.find((e) => e.id === params.id);
  if (!entity) notFound();

  const entityProjects = projects
    .filter((p) => p.entityId === entity.id)
    .map((p) => (isOwner ? p : shapeProjectForViewer(p, false)))
    .filter((p) => p !== null)
    .sort((a, b) => {
      const aTime = isTeaser(a) ? 0 : a.updatedAt;
      const bTime = isTeaser(b) ? 0 : b.updatedAt;
      return bTime - aTime;
    });

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: ENTITY_COLOR_HEX[entity.color] }}
            />
            <span className="label">{entity.kind.replace("_", " ")}</span>
          </div>
          <h1 className="hero text-2xl">{entity.name}</h1>
          {entity.note && <p className="text-charcoal/60 text-sm mt-1">{entity.note}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/new?entityId=${entity.id}`} className="btn-primary">
            + Project
          </Link>
          {isOwner && (
            <form action={deleteEntityAction}>
              <input type="hidden" name="id" value={entity.id} />
              <button className="btn text-oxblood" title="Delete entity and its projects">
                Delete
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {entityProjects.length === 0 && (
          <p className="text-charcoal/60 text-sm">No projects yet under {entity.name}.</p>
        )}
        {entityProjects.map((p) =>
          isTeaser(p) ? (
            <div key={p.id} className="card p-4 border-navy/30 bg-navy/5">
              <div className="text-[10px] uppercase tracking-wider font-structural text-navy mb-1">
                {p.title}
              </div>
              <p className="text-sm text-charcoal italic">{p.teaserMessage}</p>
            </div>
          ) : (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="card p-4 flex items-center justify-between hover:border-navy/50 transition-colors"
            >
              <div>
                <div className="text-charcoal">{p.title}</div>
                <div className="text-xs text-charcoal/50 font-structural mt-0.5">
                  {PROJECT_TYPE_LABELS[p.type]} · {p.status}
                  {p.dueDate ? ` · due ${p.dueDate}` : ""}
                </div>
              </div>
              <span className="text-xs font-structural text-navy">{TRIAGE_LABELS[p.triage]}</span>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
