import * as store from "@/lib/store";
import { auth } from "@/auth";
import { PROJECT_TYPE_LABELS, TRIAGE_LABELS } from "@/lib/types";
import { createProjectAction } from "@/lib/actions";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: { entityId?: string };
}) {
  const session = await auth();
  const allowed = await store.getAllowedEntityIds(session?.user?.email);
  const allEntities = await store.getEntities();
  const entities = allowed === "all" ? allEntities : allEntities.filter((e) => allowed.includes(e.id));

  return (
    <div className="max-w-xl">
      <h1 className="hero text-2xl mb-6">New project</h1>
      <form action={createProjectAction} className="card p-6 space-y-4">
        <div>
          <label className="label block mb-1">Entity</label>
          <select name="entityId" className="input" defaultValue={searchParams.entityId} required>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label block mb-1">Title</label>
          <input name="title" className="input" required placeholder="e.g. Eagle Fourth of July campaign" />
        </div>
        <div>
          <label className="label block mb-1">Description</label>
          <textarea name="description" className="input" rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label block mb-1">Type</label>
            <select name="type" className="input" defaultValue="other">
              {Object.entries(PROJECT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label block mb-1">Triage</label>
            <select name="triage" className="input" defaultValue="next">
              {Object.entries(TRIAGE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label block mb-1">Status</label>
            <select name="status" className="input" defaultValue="active">
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="done">Done</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="label block mb-1">Due date (optional)</label>
            <input name="dueDate" type="date" className="input" />
          </div>
        </div>
        <div>
          <label className="label block mb-1">Collaborators (comma separated, optional)</label>
          <input name="collaborators" className="input" placeholder="e.g. Dan" />
        </div>
        <button type="submit" className="btn-primary w-full justify-center">
          Create project
        </button>
      </form>
    </div>
  );
}
