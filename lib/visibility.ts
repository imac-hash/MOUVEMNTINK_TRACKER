import { Project, TriageBucket } from "./types";

export interface ProjectTeaser {
  kind: "teaser";
  id: string;
  entityId: string;
  title: string;
  teaserMessage: string;
  triage: TriageBucket;
}

export type ShapedProject = Project | ProjectTeaser;

export function isTeaser(p: ShapedProject): p is ProjectTeaser {
  return "kind" in p && p.kind === "teaser";
}

export function shapeProjectForViewer(
  project: Project,
  isOwner: boolean
): ShapedProject | null {
  if (isOwner) return project;

  // Billing items are money data and get a strictly stronger rule than
  // tasks/links: they require the project to be gated AND the item to be
  // explicitly released. There is no ungated-billing-open case, ever —
  // even on the pass-through path below, billing items are stripped.
  if (!project.gated) return { ...project, billingItems: [] };

  const tasks = project.tasks.filter((t) => t.visibleToCollaborators);
  const links = project.links.filter((l) => l.visibleToCollaborators);
  const billingItems = (project.billingItems || []).filter(
    (b) => b.visibleToCollaborators
  );

  if (tasks.length === 0 && links.length === 0 && billingItems.length === 0) {
    if (project.teaserMessage) {
      return {
        kind: "teaser",
        id: project.id,
        entityId: project.entityId,
        title: project.teaserTitle || "Something's coming",
        teaserMessage: project.teaserMessage,
        triage: project.triage,
      };
    }
    return null;
  }

  return {
    id: project.id,
    entityId: project.entityId,
    title: project.title,
    description: project.description,
    type: project.type,
    status: project.status,
    triage: project.triage,
    dueDate: project.dueDate,
    tags: [],
    links,
    tasks,
    billingItems,
    collaborators: [],
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    gated: true,
  };
}
