"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import * as store from "./store";
import { stripeClient, snapshotFromInvoice } from "./stripe";
import { EntityColor, ProjectStatus, ProjectType, TriageBucket } from "./types";

async function requireOwner() {
  const session = await auth();
  if (!store.isOwnerEmail(session?.user?.email)) {
    throw new Error("Only the owner can do this.");
  }
}

async function requireEntityAccess(entityId: string) {
  const session = await auth();
  const allowed = await store.getAllowedEntityIds(session?.user?.email);
  if (allowed !== "all" && !allowed.includes(entityId)) {
    throw new Error("You don't have access to that entity.");
  }
}

async function requireProjectAccess(projectId: string) {
  const project = await store.getProject(projectId);
  if (!project) throw new Error("Project not found.");
  await requireEntityAccess(project.entityId);
  return project;
}

export async function createEntityAction(formData: FormData) {
  await requireOwner();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const kind = String(formData.get("kind") || "business") as any;
  const color = String(formData.get("color") || "brass") as EntityColor;
  const note = String(formData.get("note") || "").trim() || undefined;
  await store.createEntity({ name, kind, color, note });
  revalidatePath("/entities");
  revalidatePath("/dashboard");
}

export async function deleteEntityAction(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id"));
  await store.deleteEntity(id);
  revalidatePath("/entities");
  revalidatePath("/dashboard");
  redirect("/entities");
}

export async function createProjectAction(formData: FormData) {
  const entityId = String(formData.get("entityId"));
  await requireEntityAccess(entityId);
  const title = String(formData.get("title") || "").trim();
  if (!title || !entityId) return;
  const type = String(formData.get("type") || "other") as ProjectType;
  const triage = String(formData.get("triage") || "next") as TriageBucket;
  const status = String(formData.get("status") || "active") as ProjectStatus;
  const description = String(formData.get("description") || "").trim() || undefined;
  const dueDate = String(formData.get("dueDate") || "").trim() || undefined;
  const collaboratorsRaw = String(formData.get("collaborators") || "").trim();
  const collaborators = collaboratorsRaw
    ? collaboratorsRaw.split(",").map((c) => c.trim()).filter(Boolean)
    : [];
  const project = await store.createProject({
    entityId,
    title,
    description,
    type,
    triage,
    status,
    dueDate,
    collaborators,
  });
  revalidatePath("/dashboard");
  revalidatePath(`/entities/${entityId}`);
  redirect(`/projects/${project.id}`);
}

export async function updateProjectAction(formData: FormData) {
  const id = String(formData.get("id"));
  await requireProjectAccess(id);
  const patch: any = {};
  for (const key of ["title", "description", "type", "status", "triage", "dueDate", "notes"]) {
    const v = formData.get(key);
    if (v !== null) patch[key] = String(v);
  }
  const collaboratorsRaw = formData.get("collaborators");
  if (collaboratorsRaw !== null) {
    patch.collaborators = String(collaboratorsRaw)
      .split(",").map((c) => c.trim()).filter(Boolean);
  }
  await store.updateProject(id, patch);
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
}

export async function setTriageAction(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id"));
  await requireProjectAccess(id);
  const triage = String(formData.get("triage")) as TriageBucket;
  await store.updateProject(id, { triage });
  revalidatePath("/dashboard");
}

export async function deleteProjectAction(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id"));
  const project = await requireProjectAccess(id);
  await store.deleteProject(id);
  revalidatePath("/dashboard");
  revalidatePath(`/entities/${project.entityId}`);
  redirect(`/entities/${project.entityId}`);
}

export async function addTaskAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  await requireProjectAccess(projectId);
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  await store.addTask(projectId, title);
  revalidatePath(`/projects/${projectId}`);
}

export async function toggleTaskAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  await requireProjectAccess(projectId);
  const taskId = String(formData.get("taskId"));
  await store.toggleTask(projectId, taskId);
  revalidatePath(`/projects/${projectId}`);
}

export async function addLinkAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  await requireProjectAccess(projectId);
  const label = String(formData.get("label") || "").trim();
  const url = String(formData.get("url") || "").trim();
  if (!label || !url) return;
  await store.addLink(projectId, label, url);
  revalidatePath(`/projects/${projectId}`);
}

export async function setProjectGatedAction(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id"));
  const gated = formData.get("gated") === "on";
  await store.setProjectGated(id, gated);
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
}

export async function setTeaserMessageAction(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id"));
  const teaserTitle = String(formData.get("teaserTitle") || "").trim();
  const teaserMessage = String(formData.get("teaserMessage") || "").trim();
  await store.setTeaser(id, teaserTitle, teaserMessage);
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/entities");
}

export async function setTaskVisibilityAction(formData: FormData) {
  await requireOwner();
  const projectId = String(formData.get("projectId"));
  const taskId = String(formData.get("taskId"));
  const visible = formData.get("visible") === "on";
  await store.setTaskVisibility(projectId, taskId, visible);
  revalidatePath(`/projects/${projectId}`);
}

export async function setLinkVisibilityAction(formData: FormData) {
  await requireOwner();
  const projectId = String(formData.get("projectId"));
  const linkId = String(formData.get("linkId"));
  const visible = formData.get("visible") === "on";
  await store.setLinkVisibility(projectId, linkId, visible);
  revalidatePath(`/projects/${projectId}`);
}

// Stripe is the source of truth for invoices — create/edit them in the
// Stripe dashboard (tag the invoice with metadata `project_id` = this
// project's id) and the webhook syncs them in automatically. This action is
// a manual pull for the case a webhook delivery was missed, or for invoices
// that existed before the webhook was registered — it re-fetches every
// invoice tagged with this project and reconciles it the same way the
// webhook would.
export async function syncBillingFromStripeAction(formData: FormData) {
  await requireOwner();
  const projectId = String(formData.get("projectId"));
  const project = await store.getProject(projectId);
  if (!project) throw new Error("Project not found.");

  const stripe = stripeClient();
  const invoices = await stripe.invoices.search({
    query: `metadata['project_id']:'${projectId}'`,
    limit: 100,
  });

  for (const invoice of invoices.data) {
    const snapshot = snapshotFromInvoice(invoice);
    if (snapshot) await store.upsertBillingItemFromStripe(snapshot);
  }

  revalidatePath(`/projects/${projectId}`);
}

export async function setBillingItemVisibilityAction(formData: FormData) {
  await requireOwner();
  const projectId = String(formData.get("projectId"));
  const billingItemId = String(formData.get("billingItemId"));
  const visible = formData.get("visible") === "on";
  await store.setBillingItemVisibility(projectId, billingItemId, visible);
  revalidatePath(`/projects/${projectId}`);
}

export async function generateShareLinkAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  await requireProjectAccess(projectId);
  await store.generateShareToken(projectId);
  revalidatePath(`/projects/${projectId}`);
}

export async function revokeShareLinkAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  await requireProjectAccess(projectId);
  await store.revokeShareToken(projectId);
  revalidatePath(`/projects/${projectId}`);
}

// --- Collaborator management (owner only) ---

export async function upsertCollaboratorAction(formData: FormData) {
  await requireOwner();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  if (!email) return;
  const allowedEntityIds = formData.getAll("entityIds").map(String);
  await store.upsertCollaborator(email, name, allowedEntityIds);
  revalidatePath("/collaborators");
}

export async function removeCollaboratorAction(formData: FormData) {
  await requireOwner();
  const email = String(formData.get("email") || "");
  await store.removeCollaborator(email);
  revalidatePath("/collaborators");
}
