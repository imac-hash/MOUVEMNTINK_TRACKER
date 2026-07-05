import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";
import { readFileSync } from "fs";

const envLocal = readFileSync(new URL("../.env.local", import.meta.url), "utf-8");
const env = Object.fromEntries(
  envLocal
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      const key = l.slice(0, idx).trim();
      const val = l.slice(idx + 1).trim().replace(/^"|"$/g, "");
      return [key, val];
    })
);

const redis = new Redis({
  url: env.KV_REST_API_URL,
  token: env.KV_REST_API_TOKEN,
});

const now = Date.now();

const entities = await redis.get("entities");
const eagle = entities.find((e) => e.name === "Eagle Portland");
if (!eagle) {
  console.error("Eagle Portland entity not found. Aborting.");
  process.exit(1);
}

const taskTitles = [
  "Creative Brief",
  "Pitch Deck",
  "Pitch",
  "Digital rebrand ROI forecast",
  "Copy",
  "Posters",
  "Menu",
  "Line-up",
  "Social",
  "Display",
];

const tasks = taskTitles.map((title) => ({
  id: nanoid(6),
  title,
  done: false,
  createdAt: now,
}));

const project = {
  id: nanoid(8),
  entityId: eagle.id,
  title: "Eagle Halloween",
  description: undefined,
  type: "marketing_brief",
  status: "active",
  triage: "now",
  dueDate: undefined,
  tags: [],
  links: [],
  tasks,
  notes: undefined,
  collaborators: [],
  shareToken: undefined,
  gated: true,
  createdAt: now,
  updatedAt: now,
};

const projects = await redis.get("projects");
if (projects.some((p) => p.title === "Eagle Halloween")) {
  console.error('A project named "Eagle Halloween" already exists. Aborting to avoid duplicates.');
  process.exit(1);
}

await redis.set("projects", [...projects, project]);

console.log(`Created "Eagle Halloween" (${project.id}) under Eagle Portland (${eagle.id}), gated=true.`);
console.log("Tasks (all owner-only until released):");
for (const t of tasks) {
  console.log(`  - ${t.title}`);
}
