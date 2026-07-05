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

const entity = {
  id: nanoid(8),
  name: "Eagle Portland",
  kind: "business",
  color: "rust",
  note: "IJ Mackay Movement Inc. | Client: Dan | 835 N Lombard, Portland OR",
  createdAt: now,
};

function task(title, done) {
  return { id: nanoid(6), title, done, createdAt: now };
}

// Source: Eagle Portland Ops Board (Google Sheet), workstream tabs.
const workstreams = [
  {
    title: "Events",
    type: "events",
    triage: "next",
    notes: "Sunday event name TBD -- blocking copy lock",
    items: [
      ["Free Ballin' (Thursdays — recurring)", false],
      ["Karaoke (copy done — final image pending)", false],
      ["Naked Pool Championship (shelved pending resources)", false],
      ["Halloween", false],
      ["Sunday Event (name TBD — blocking copy lock)", false],
    ],
  },
  {
    title: "Website",
    type: "website",
    triage: "now",
    notes:
      "Rebrand + full-stack build. Deferred items unbilled -- flag before next sprint.",
    items: [
      ["eagle-web / eagle-internal / studio-eaglepdx deployed", true],
      ["Security layer: HMAC, rate limiting, honeypot, VIP lockdown", true],
      ["Stripe payments (deferred / unbilled)", false],
      ["Pre-launch password gate (deferred / unbilled)", false],
      ["Mailing-list signup UI (deferred / unbilled)", false],
      ["Hero video poster frame (deferred / unbilled)", false],
      ["Hashed staff PINs (deferred / unbilled)", false],
      ["KV-backed rate limiting (deferred / unbilled)", false],
    ],
  },
  {
    title: "Posters",
    type: "events",
    tags: ["brand_system"],
    triage: "next",
    notes:
      "Pipeline: Midjourney -> gradient map -> halftone -> VHS chromatic aberration.",
    items: [
      ["Game Night", true],
      ["Slutty BBQ 1", true],
      ["Slutty BBQ 2 (new)", false],
      ["Karaoke — copy (copy only)", true],
      ["Undergear — copy (copy only)", true],
      ["Leather, Scotch & Social Lure (new)", false],
      ["Naked Pool Championship (shelved pending resources)", false],
      ["Free Ballin', Halloween, Sunday event (remaining)", false],
    ],
  },
  {
    title: "Copy",
    type: "copy",
    triage: "someday",
    notes: "Voice: vulgar without grotesque.",
    items: [
      ["Slutty BBQ / Cookout", true],
      ["Game Night", true],
      ["Naked Pool Championship", true],
      ["Karaoke (Hump Day)", true],
      ["Undergear", true],
      ["First Fridays (Leather, Scotch & Cigar Social)", true],
      ["About Us page", true],
      ["Pride Month blog post", true],
    ],
  },
  {
    title: "Billing",
    type: "billing",
    triage: "now",
    notes:
      "Docs live in _BDBILLLINGTAX subfolder. New period now being compiled.",
    items: [
      ["Dual-track format live (REAL $75/hr / INTERNAL $175/hr)", true],
      ["Doc 02 (May 12-16) — never saved standalone (gap)", false],
      ["New billing period being compiled", false],
    ],
  },
  {
    title: "Identity",
    type: "brand_system",
    triage: "next",
    notes: "New workstream: logo, marks & brand identity system now underway.",
    items: [["Logo, marks & brand identity system (new workstream)", false]],
  },
];

const projects = workstreams.map((w) => ({
  id: nanoid(8),
  entityId: entity.id,
  title: `Eagle Portland — ${w.title}`,
  description: undefined,
  type: w.type,
  status: "active",
  triage: w.triage,
  dueDate: undefined,
  tags: w.tags || [],
  links: [],
  tasks: w.items.map(([title, done]) => task(title, done)),
  notes: w.notes,
  collaborators: [],
  shareToken: undefined,
  createdAt: now,
  updatedAt: now,
}));

const existingEntities = (await redis.get("entities")) || [];
const existingProjects = (await redis.get("projects")) || [];

if (existingEntities.some((e) => e.name === "Eagle Portland")) {
  console.error("An entity named 'Eagle Portland' already exists. Aborting to avoid duplicates.");
  process.exit(1);
}

await redis.set("entities", [...existingEntities, entity]);
await redis.set("projects", [...existingProjects, ...projects]);

console.log(`Created entity "Eagle Portland" (${entity.id}) with ${projects.length} projects:`);
for (const p of projects) {
  console.log(`  - ${p.title} (${p.tasks.filter((t) => t.done).length}/${p.tasks.length} done)`);
}
