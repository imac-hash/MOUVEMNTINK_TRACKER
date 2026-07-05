import { Project } from "./types";

export function shapeProjectForViewer(
  project: Project,
  isOwner: boolean
): Project | null {
  if (isOwner) return project;
  if (!project.gated) return project;

  const tasks = project.tasks.filter((t) => t.visibleToCollaborators);
  const links = project.links.filter((l) => l.visibleToCollaborators);

  if (tasks.length === 0 && links.length === 0) return null;

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
    collaborators: [],
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    gated: true,
  };
}
