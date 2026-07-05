import NextLink from "next/link";
import { notFound } from "next/navigation";
import * as store from "@/lib/store";
import { auth } from "@/auth";
import { isTeaser, shapeProjectForViewer } from "@/lib/visibility";
import { BILLING_STATUS_LABELS, PROJECT_TYPE_LABELS, TRIAGE_LABELS } from "@/lib/types";
import {
  updateProjectAction,
  deleteProjectAction,
  addTaskAction,
  toggleTaskAction,
  addLinkAction,
  generateShareLinkAction,
  revokeShareLinkAction,
  setProjectGatedAction,
  setTaskVisibilityAction,
  setLinkVisibilityAction,
  setTeaserMessageAction,
  createBillingItemAction,
  setBillingItemVisibilityAction,
} from "@/lib/actions";

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await store.getProject(params.id);
  if (!project) notFound();

  const session = await auth();
  const isOwner = store.isOwnerEmail(session?.user?.email);
  const allowed = await store.getAllowedEntityIds(session?.user?.email);
  if (allowed !== "all" && !allowed.includes(project.entityId)) notFound();

  const shaped = shapeProjectForViewer(project, isOwner);
  if (!shaped) notFound();

  const entities = await store.getEntities();
  const entity = entities.find((e) => e.id === project.entityId);

  if (!isOwner) {
    if (isTeaser(shaped)) {
      return (
        <div className="max-w-2xl space-y-6">
          <div>
            <NextLink href={entity ? `/entities/${entity.id}` : "/entities"} className="label hover:text-navy">
              ← {entity?.name || "entities"}
            </NextLink>
          </div>
          <div className="card p-6 space-y-2 border-navy/30 bg-navy/5">
            <h1 className="hero text-2xl">{shaped.title}</h1>
            <p className="text-sm text-charcoal italic">{shaped.teaserMessage}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <NextLink href={entity ? `/entities/${entity.id}` : "/entities"} className="label hover:text-navy">
            ← {entity?.name || "entities"}
          </NextLink>
        </div>
        <div className="card p-6 space-y-2">
          <h1 className="hero text-2xl">{shaped.title}</h1>
          {shaped.description && <p className="text-sm text-charcoal/70">{shaped.description}</p>}
          <p className="label">{PROJECT_TYPE_LABELS[shaped.type]}</p>
        </div>
        <div className="card p-6 space-y-3">
          <h2 className="label">Tasks</h2>
          {shaped.tasks.length === 0 && <p className="text-charcoal/50 text-sm">No tasks yet.</p>}
          {shaped.tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2">
              <span className="text-lg leading-none">{t.done ? "☑" : "☐"}</span>
              <span className={t.done ? "line-through text-charcoal/40 text-sm" : "text-sm text-charcoal"}>
                {t.title}
              </span>
            </div>
          ))}
        </div>
        <div className="card p-6 space-y-3">
          <h2 className="label">Links</h2>
          {shaped.links.length === 0 && <p className="text-charcoal/50 text-sm">No links yet.</p>}
          {shaped.links.map((l) => (
            <a key={l.id} href={l.url} target="_blank" className="block text-sm text-charcoal hover:text-navy">
              {l.label} <span className="text-charcoal/50 text-xs">— {l.url}</span>
            </a>
          ))}
        </div>
        {shaped.billingItems.length > 0 && (
          <div className="card p-6 space-y-3">
            <h2 className="label">Billing</h2>
            {shaped.billingItems.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="text-sm text-charcoal">{b.description}</div>
                  <div className="text-xs text-charcoal/50 font-structural mt-0.5">
                    {formatAmount(b.amountCents, b.currency)} · {BILLING_STATUS_LABELS[b.status]}
                  </div>
                </div>
                {b.hostedInvoiceUrl && (
                  <a href={b.hostedInvoiceUrl} target="_blank" className="btn-primary text-xs whitespace-nowrap">
                    View & Pay Invoice
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const shareUrl = project.shareToken
    ? `/share/${project.shareToken}`
    : null;

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        <div>
          <NextLink href={entity ? `/entities/${entity.id}` : "/entities"} className="label hover:text-navy">
            ← {entity?.name || "entities"}
          </NextLink>
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

        <form action={setProjectGatedAction} className="card p-6 space-y-3">
          <input type="hidden" name="id" value={project.id} />
          <h2 className="label">Access</h2>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input
              type="checkbox"
              name="gated"
              defaultChecked={project.gated}
              className="accent-navy"
            />
            Gated — hidden from collaborators until released
          </label>
          <button type="submit" className="btn text-xs">Save</button>
        </form>

        {project.gated && (
          <form action={setTeaserMessageAction} className="card p-6 space-y-3">
            <input type="hidden" name="id" value={project.id} />
            <h2 className="label">Teaser (optional)</h2>
            <p className="text-xs text-charcoal/50">
              When set, collaborators see a teaser instead of nothing at all —
              for surprises you want to hint at without revealing details.
              Leave both blank for fully invisible. The real project title
              is never shown here — set a vague display title below, since
              the real one can give away what's coming.
            </p>
            <div>
              <label className="label block mb-1">Teaser title</label>
              <input
                name="teaserTitle"
                defaultValue={project.teaserTitle}
                className="input"
                placeholder="Something's coming"
              />
            </div>
            <div>
              <label className="label block mb-1">Teaser message</label>
              <input
                name="teaserMessage"
                defaultValue={project.teaserMessage}
                className="input"
                placeholder="Something big is coming…"
              />
            </div>
            <button type="submit" className="btn text-xs">Save</button>
          </form>
        )}

        <div className="card p-6 space-y-3">
          <h2 className="label">Tasks</h2>
          {project.tasks.length === 0 && (
            <p className="text-charcoal/50 text-sm">No tasks yet.</p>
          )}
          {project.tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3">
              <form action={toggleTaskAction} className="flex items-center gap-2">
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="taskId" value={t.id} />
                <button type="submit" className="text-lg leading-none">
                  {t.done ? "☑" : "☐"}
                </button>
                <span className={t.done ? "line-through text-charcoal/40 text-sm" : "text-sm text-charcoal"}>
                  {t.title}
                </span>
              </form>
              {project.gated && (
                <form action={setTaskVisibilityAction} className="flex items-center gap-1">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="taskId" value={t.id} />
                  <label className="flex items-center gap-1 text-xs text-charcoal/60">
                    <input
                      type="checkbox"
                      name="visible"
                      defaultChecked={t.visibleToCollaborators}
                      className="accent-navy"
                    />
                    visible to collaborators
                  </label>
                  <button type="submit" className="text-xs underline text-charcoal/60 hover:text-navy">
                    save
                  </button>
                </form>
              )}
            </div>
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
          {project.links.map((l) => (
            <div key={l.id} className="flex items-center gap-3">
              <a href={l.url} target="_blank" className="block text-sm text-charcoal hover:text-navy">
                {l.label} <span className="text-charcoal/50 text-xs">— {l.url}</span>
              </a>
              {project.gated && (
                <form action={setLinkVisibilityAction} className="flex items-center gap-1">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="linkId" value={l.id} />
                  <label className="flex items-center gap-1 text-xs text-charcoal/60">
                    <input
                      type="checkbox"
                      name="visible"
                      defaultChecked={l.visibleToCollaborators}
                      className="accent-navy"
                    />
                    visible to collaborators
                  </label>
                  <button type="submit" className="text-xs underline text-charcoal/60 hover:text-navy">
                    save
                  </button>
                </form>
              )}
            </div>
          ))}
          <form action={addLinkAction} className="flex gap-2 pt-2">
            <input type="hidden" name="projectId" value={project.id} />
            <input name="label" className="input" placeholder="Label (e.g. Figma)" />
            <input name="url" className="input" placeholder="https://…" />
            <button className="btn">Add</button>
          </form>
        </div>

        {project.gated && (
          <div className="card p-6 space-y-3">
            <h2 className="label">Billing</h2>
            {project.billingItems.length === 0 && (
              <p className="text-charcoal/50 text-sm">No billing items yet.</p>
            )}
            {project.billingItems.map((b) => (
              <div key={b.id} className="flex items-center gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                <div className="flex-1">
                  <div className="text-sm text-charcoal">{b.description}</div>
                  <div className="text-xs text-charcoal/50 font-structural mt-0.5">
                    {formatAmount(b.amountCents, b.currency)} · {BILLING_STATUS_LABELS[b.status]}
                    {b.hostedInvoiceUrl && (
                      <>
                        {" · "}
                        <a href={b.hostedInvoiceUrl} target="_blank" className="underline hover:text-navy">
                          View Stripe invoice
                        </a>
                      </>
                    )}
                  </div>
                </div>
                <form action={setBillingItemVisibilityAction} className="flex items-center gap-1">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="billingItemId" value={b.id} />
                  <label className="flex items-center gap-1 text-xs text-charcoal/60">
                    <input
                      type="checkbox"
                      name="visible"
                      defaultChecked={b.visibleToCollaborators}
                      className="accent-navy"
                    />
                    visible to collaborators
                  </label>
                  <button type="submit" className="text-xs underline text-charcoal/60 hover:text-navy">
                    save
                  </button>
                </form>
              </div>
            ))}
            <form action={createBillingItemAction} className="space-y-2 pt-2">
              <input type="hidden" name="projectId" value={project.id} />
              <p className="text-xs text-charcoal/50">
                Creates a real Stripe invoice and customer if one doesn't
                exist yet — this is not just a task.
              </p>
              <div className="flex gap-2">
                <input name="description" className="input" placeholder="Description" />
                <input name="amount" type="number" step="0.01" min="0" className="input w-32" placeholder="Amount ($)" />
                <input name="dueDate" type="date" className="input" />
                <button className="btn whitespace-nowrap">Create invoice</button>
              </div>
            </form>
          </div>
        )}

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
