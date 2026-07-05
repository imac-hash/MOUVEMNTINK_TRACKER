import Link from "next/link";
import { notFound } from "next/navigation";
import * as store from "@/lib/store";
import { auth } from "@/auth";
import { PROJECT_TYPE_LABELS, TRIAGE_LABELS } from "@/lib/types";
import {
  updateProjectAction,
  deleteProjectAction,
  addTaskAction,
  toggleTaskAction,
  addLinkAction,
  generateShareLinkAction,
  revokeShareLinkAction,
} from "@/lib/actions";

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await store.getProject(params.id);
  if (!project) notFound();

  const session = await auth();
  const allowed = await store.getAllowedEntityIds(session?.user?.email);
  if (allowed !== "all" && !allowed.includes(project.entityId)) notFound();

  const entities = await store.getEntities();
  const entity = entities.find((e) => e.id === project.entityId);

  const shareUrl = project.shareToken
    ? `/share/${project.shareToken}`
    : null;

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        <div>
          <Link href={entity ? `/entities/${entity.id}` : "/entities"} className="label hover:text-navy">
            ← {entity?.name || "entities"}
          </Link>
        </div>

        <form action={updateProjectAction} className="card p-6 space-y-4">
          <input type="hidden" name="id" value={project.id} />
          <div>
            <label className="label block mb-1">Title</label>
            <input name="title" defaultValue={project.title} className="input" />
          </div>
          <div>
            <label className="label block mb-1">Description</label>
            <textarea name="description" defaultValue={project.description} className="input" rows={3} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label block mb-1">Type</label>
              <select name="type" defaultValue={project.type} className="input">
                {Object.entries(PROJECT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label block mb-1">Triage</label>
              <select name="triage" defaultValue={project.triage} className="input">
                {Object.entries(TRIAGE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label block mb-1">Status</label>
              <select name="status" defaultValue={project.status} className="input">
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="done">Done</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label block mb-1">Due date</label>
              <input name="dueDate" type="date" defaultValue={project.dueDate} className="input" />
            </div>
            <div>
              <label className="label block mb-1">Collaborators</label>
              <input name="collaborators" defaultValue={project.collaborators.join(", ")} className="input" />
            </div>
          </div>
          <div>
            <label className="label block mb-1">Notes</label>
            <textarea name="notes" defaultValue={project.notes} className="input" rows={4} />
          </div>
          <button type="submit" className="btn-primary">Save changes</button>
        </form>

        <div className="card p-6 space-y-3">
          <h2 className="label">Tasks</h2>
          {project.tasks.length === 0 && (
            <p className="text-charcoal/50 text-sm">No tasks yet.</p>
          )}
          {project.tasks.map((t) => (
            <form action={toggleTaskAction} key={t.id} className="flex items-center gap-2">
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="taskId" value={t.id} />
              <button type="submit" className="text-lg leading-none">
                {t.done ? "☑" : "☐"}
              </button>
              <span className={t.done ? "line-through text-charcoal/40 text-sm" : "text-sm text-charcoal"}>
                {t.title}
              </span>
            </form>
          ))}
          <form action={addTaskAction} className="flex gap-2 pt-2">
            <input type="hidden" name="projectId" value={project.id} />
            <input name="title" className="input" placeholder="Add a task" />
            <button className="btn">Add</button>
          </form>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="label">Links</h2>
          {project.links.length === 0 && <p className="text-charcoal/50 text-sm">No links yet.</p>}
          {project.links.map((l, i) => (
            <a key={i} href={l.url} target="_blank" className="block text-sm text-charcoal hover:text-navy">
              {l.label} <span className="text-charcoal/50 text-xs">— {l.url}</span>
            </a>
          ))}
          <form action={addLinkAction} className="flex gap-2 pt-2">
            <input type="hidden" name="projectId" value={project.id} />
            <input name="label" className="input" placeholder="Label (e.g. Figma)" />
            <input name="url" className="input" placeholder="https://…" />
            <button className="btn">Add</button>
          </form>
        </div>

        <form action={deleteProjectAction} className="pt-2">
          <input type="hidden" name="id" value={project.id} />
          <input type="hidden" name="entityId" value={project.entityId} />
          <button className="text-xs font-structural text-oxblood hover:opacity-80">
            Delete this project
          </button>
        </form>
      </div>

      <div className="space-y-4 h-fit">
        <div className="card p-5 space-y-3">
          <h2 className="label">Share (read-only, no passcode)</h2>
          <p className="text-xs text-charcoal/50">
            For collaborators like Dan — shows only this project, nothing else on the site.
          </p>
          {shareUrl ? (
            <>
              <div className="text-xs font-structural text-charcoal break-all bg-bone/50 border border-line rounded-sm p-2">
                {shareUrl}
              </div>
              <form action={revokeShareLinkAction}>
                <input type="hidden" name="projectId" value={project.id} />
                <button className="btn w-full justify-center text-xs">Revoke link</button>
              </form>
            </>
          ) : (
            <form action={generateShareLinkAction}>
              <input type="hidden" name="projectId" value={project.id} />
              <button className="btn-primary w-full justify-center text-xs">Generate share link</button>
            </form>
          )}
        </div>

        <div className="card p-5 space-y-1">
          <h2 className="label">Meta</h2>
          <p className="text-xs text-charcoal/50 font-structural">
            Created {new Date(project.createdAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-charcoal/50 font-structural">
            Updated {new Date(project.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
