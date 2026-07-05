import Link from "next/link";
import * as store from "@/lib/store";
import { auth } from "@/auth";
import { ENTITY_COLOR_HEX, EntityColor } from "@/lib/types";
import { createEntityAction } from "@/lib/actions";

const COLORS: EntityColor[] = ["brass", "rust", "teal", "plum", "olive", "slate", "rose"];

export default async function EntitiesPage() {
  const session = await auth();
  const isOwner = store.isOwnerEmail(session?.user?.email);
  const allowed = await store.getAllowedEntityIds(session?.user?.email);

  const [allEntities, allProjects] = await Promise.all([
    store.getEntities(),
    store.getProjects(),
  ]);
  const entities = allowed === "all" ? allEntities : allEntities.filter((e) => allowed.includes(e.id));
  const projects = allProjects;

  return (
    <div className={isOwner ? "grid md:grid-cols-3 gap-8" : ""}>
      <div className={isOwner ? "md:col-span-2 space-y-3" : "space-y-3"}>
        <h1 className="hero text-2xl mb-4">Entities</h1>
        {entities.length === 0 && (
          <p className="text-charcoal/60 text-sm">
            {isOwner
              ? "Nothing yet — add a business, venture, or your personal creative lane on the right."
              : "No entities have been shared with you yet."}
          </p>
        )}
        {entities.map((e) => {
          const count = projects.filter((p) => p.entityId === e.id && p.status !== "archived").length;
          return (
            <Link
              key={e.id}
              href={`/entities/${e.id}`}
              className="card p-4 flex items-center justify-between hover:border-navy/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: ENTITY_COLOR_HEX[e.color] }}
                />
                <div>
                  <div className="text-charcoal">{e.name}</div>
                  <div className="text-xs text-charcoal/50 font-structural">{e.kind.replace("_", " ")}</div>
                </div>
              </div>
              <span className="text-xs text-charcoal/50 font-structural">{count} projects</span>
            </Link>
          );
        })}
      </div>

      {isOwner && (
        <div className="card p-5 space-y-4 h-fit">
          <h2 className="label">New entity</h2>
          <form action={createEntityAction} className="space-y-3">
            <div>
              <label className="label block mb-1">Name</label>
              <input name="name" className="input" placeholder="e.g. Daddy Jo" required />
            </div>
            <div>
              <label className="label block mb-1">Kind</label>
              <select name="kind" className="input">
                <option value="business">Business / venture</option>
                <option value="personal_creative">Personal creative</option>
                <option value="internal_tools">Internal apps / tools</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label block mb-1">Color</label>
              <select name="color" className="input">
                {COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label block mb-1">Note (optional)</label>
              <textarea name="note" className="input" rows={2} />
            </div>
            <button type="submit" className="btn-primary w-full justify-center">
              Add entity
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
