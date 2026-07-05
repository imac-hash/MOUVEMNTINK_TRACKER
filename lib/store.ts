import { nanoid } from "nanoid";
import { Entity, Link, Project, Task } from "./types";
import fs from "fs";
import path from "path";

// Storage abstraction: uses Vercel KV in production (when env vars are
// present), falls back to a local JSON file for local development so you
// can run `npm run dev` without setting up KV first.

const USE_KV = !!process.env.KV_REST_API_URL || !!process.env.UPSTASH_REDIS_REST_URL;

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const LOCAL_DB_PATH = path.join(process.cwd(), ".data", "db.json");

interface DB {
  entities: Entity[];
  projects: Project[];
}

function readLocal(): DB {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    return { entities: [], projects: [] };
  }
  return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf-8"));
}

function writeLocal(db: DB) {
  fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2));
}

let _redis: import("@upstash/redis").Redis | null = null;
async function redisClient() {
  if (_redis) return _redis;
  const { Redis } = await import("@upstash/redis");
  _redis = new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! });
  return _redis;
}

async function kvGet<T>(key: string, fallback: T): Promise<T> {
  const redis = await redisClient();
  const val = await redis.get<T>(key);
  return val ?? fallback;
}

async function kvSet<T>(key: string, val: T): Promise<void> {
  const redis = await redisClient();
  await redis.set(key, val);
}

export async function getEntities(): Promise<Entity[]> {
  if (USE_KV) return kvGet<Entity[]>("entities", []);
  return readLocal().entities;
}

export async function getProjects(): Promise<Project[]> {
  if (USE_KV) return kvGet<Project[]>("projects", []);
  return readLocal().projects;
}

export async function saveEntities(entities: Entity[]): Promise<void> {
  if (USE_KV) return kvSet("entities", entities);
  const db = readLocal();
  db.entities = entities;
  writeLocal(db);
}

export async function saveProjects(projects: Project[]): Promise<void> {
  if (USE_KV) return kvSet("projects", projects);
  const db = readLocal();
  db.projects = projects;
  writeLocal(db);
}

export async function createEntity(input: Omit<Entity, "id" | "createdAt">) {
  const entities = await getEntities();
  const entity: Entity = { ...input, id: nanoid(8), createdAt: Date.now() };
  entities.push(entity);
  await saveEntities(entities);
  return entity;
}

export async function deleteEntity(id: string) {
  const entities = (await getEntities()).filter((e) => e.id !== id);
  await saveEntities(entities);
  const projects = (await getProjects()).filter((p) => p.entityId !== id);
  await saveProjects(projects);
}

export async function createProject(
  input: Omit<Project, "id" | "createdAt" | "updatedAt" | "tasks" | "tags" | "links" | "collaborators"> &
    Partial<Pick<Project, "tasks" | "tags" | "links" | "collaborators">>
) {
  const projects = await getProjects();
  const now = Date.now();
  const project: Project = {
    tasks: [],
    tags: [],
    links: [],
    collaborators: [],
    ...input,
    id: nanoid(8),
    createdAt: now,
    updatedAt: now,
  };
  projects.push(project);
  await saveProjects(projects);
  return project;
}

export async function updateProject(id: string, patch: Partial<Project>) {
  const projects = await getProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Project not found");
  projects[idx] = { ...projects[idx], ...patch, updatedAt: Date.now() };
  await saveProjects(projects);
  return projects[idx];
}

export async function deleteProject(id: string) {
  const projects = (await getProjects()).filter((p) => p.id !== id);
  await saveProjects(projects);
}

export async function getProject(id: string) {
  const projects = await getProjects();
  return projects.find((p) => p.id === id) || null;
}

export async function getProjectByShareToken(token: string) {
  const projects = await getProjects();
  return projects.find((p) => p.shareToken === token) || null;
}

export async function generateShareToken(id: string) {
  const token = nanoid(16);
  await updateProject(id, { shareToken: token });
  return token;
}

export async function revokeShareToken(id: string) {
  await updateProject(id, { shareToken: undefined });
}

export async function toggleTask(projectId: string, taskId: string) {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");
  const tasks = project.tasks.map((t: Task) =>
    t.id === taskId ? { ...t, done: !t.done } : t
  );
  return updateProject(projectId, { tasks });
}

export async function addTask(projectId: string, title: string) {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");
  const task: Task = { id: nanoid(6), title, done: false, createdAt: Date.now() };
  return updateProject(projectId, { tasks: [...project.tasks, task] });
}

export async function addLink(projectId: string, label: string, url: string) {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");
  const link: Link = { id: nanoid(6), label, url };
  return updateProject(projectId, { links: [...project.links, link] });
}

export async function setProjectGated(projectId: string, gated: boolean) {
  return updateProject(projectId, { gated });
}

export async function setTeaserMessage(projectId: string, teaserMessage: string) {
  return updateProject(projectId, { teaserMessage: teaserMessage || undefined });
}

export async function setTaskVisibility(
  projectId: string,
  taskId: string,
  visible: boolean
) {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");
  const tasks = project.tasks.map((t: Task) =>
    t.id === taskId ? { ...t, visibleToCollaborators: visible } : t
  );
  return updateProject(projectId, { tasks });
}

export async function setLinkVisibility(
  projectId: string,
  linkId: string,
  visible: boolean
) {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");
  const links = project.links.map((l: Link) =>
    l.id === linkId ? { ...l, visibleToCollaborators: visible } : l
  );
  return updateProject(projectId, { links });
}

// --- Collaborators (access control) ---

import { Collaborator } from "./types";

export async function getCollaborators(): Promise<Collaborator[]> {
  if (USE_KV) return kvGet<Collaborator[]>("collaborators", []);
  const db = readLocal() as DB & { collaborators?: Collaborator[] };
  return db.collaborators || [];
}

export async function saveCollaborators(collaborators: Collaborator[]): Promise<void> {
  if (USE_KV) return kvSet("collaborators", collaborators);
  const db = readLocal() as DB & { collaborators?: Collaborator[] };
  db.collaborators = collaborators;
  writeLocal(db as DB);
}

export async function upsertCollaborator(
  email: string,
  name: string,
  allowedEntityIds: string[]
) {
  const collaborators = await getCollaborators();
  const idx = collaborators.findIndex((c) => c.email === email);
  if (idx === -1) {
    collaborators.push({ email, name, allowedEntityIds, createdAt: Date.now() });
  } else {
    collaborators[idx] = { ...collaborators[idx], name, allowedEntityIds };
  }
  await saveCollaborators(collaborators);
}

export async function removeCollaborator(email: string) {
  const collaborators = (await getCollaborators()).filter((c) => c.email !== email);
  await saveCollaborators(collaborators);
}

export function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  const owner = (process.env.OWNER_EMAIL || "").toLowerCase().trim();
  return owner.length > 0 && email.toLowerCase().trim() === owner;
}

export async function getAllowedEntityIds(email?: string | null): Promise<string[] | "all"> {
  if (isOwnerEmail(email)) return "all";
  if (!email) return [];
  const collaborators = await getCollaborators();
  const found = collaborators.find((c) => c.email.toLowerCase() === email.toLowerCase());
  return found ? found.allowedEntityIds : [];
}

export async function isAllowedEmail(email?: string | null): Promise<boolean> {
  if (isOwnerEmail(email)) return true;
  if (!email) return false;
  const collaborators = await getCollaborators();
  return collaborators.some((c) => c.email.toLowerCase() === email.toLowerCase());
}
