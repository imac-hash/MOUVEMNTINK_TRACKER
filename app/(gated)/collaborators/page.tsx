import { redirect } from "next/navigation";
import * as store from "@/lib/store";
import { auth } from "@/auth";
import { upsertCollaboratorAction, removeCollaboratorAction } from "@/lib/actions";

export default async function CollaboratorsPage() {
  const session = await auth();
  if (!store.isOwnerEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  const [collaborators, entities] = await Promise.all([
    store.getCollaborators(),
    store.getEntities(),
  ]);

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-3">
        <h1 className="hero text-2xl mb-4">Collaborators</h1>
        <p className="text-sm text-charcoal/60 mb-4">
          Only people listed here (plus you) can sign in. Each person only sees
          the entities checked off for them.
        </p>
        {collaborators.length === 0 && (
          <p className="text-charcoal/60 text-sm">No collaborators yet.</p>
        )}
        {collaborators.map((c) => (
          <div key={c.email} className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-charcoal">{c.name || c.email}</div>
                <div className="text-xs text-charcoal/50 font-structural">{c.email}</div>
              </div>
              <form action={removeCollaboratorAction}>
                <input type="hidden" name="email" value={c.email} />
                <button className="text-xs font-structural text-oxblood hover:opacity-80">
                  Remove
                </button>
              </form>
            </div>
            <form action={upsertCollaboratorAction} className="space-y-2">
              <input type="hidden" name="email" value={c.email} />
              <input type="hidden" name="name" value={c.name} />
              <div className="flex flex-wrap gap-3">
                {entities.map((e) => (
                  <label key={e.id} className="flex items-center gap-1.5 text-xs text-charcoal">
                    <input
                      type="checkbox"
                      name="entityIds"
                      value={e.id}
                      defaultChecked={c.allowedEntityIds.includes(e.id)}
                      className="accent-navy"
                    />
                    {e.name}
                  </label>
                ))}
              </div>
              <button className="btn text-xs">Update access</button>
            </form>
          </div>
        ))}
      </div>

      <div className="card p-5 space-y-4 h-fit">
        <h2 className="label">Add / update collaborator</h2>
        <form action={upsertCollaboratorAction} className="space-y-3">
          <div>
            <label className="label block mb-1">Name</label>
            <input name="name" className="input" placeholder="e.g. Dan" />
          </div>
          <div>
            <label className="label block mb-1">Email (they sign in with this)</label>
            <input name="email" type="email" className="input" required placeholder="dan@example.com" />
          </div>
          <div>
            <label className="label block mb-2">Entities they can access</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {entities.map((e) => (
                <label key={e.id} className="flex items-center gap-2 text-sm text-charcoal">
                  <input type="checkbox" name="entityIds" value={e.id} className="accent-navy" />
                  {e.name}
                </label>
              ))}
              {entities.length === 0 && (
                <p className="text-xs text-charcoal/50">Add an entity first.</p>
              )}
            </div>
          </div>
          <button type="submit" className="btn-primary w-full justify-center">
            Save collaborator
          </button>
        </form>
      </div>
    </div>
  );
}
