#!/usr/bin/env node
// Flip a single project's status. Narrow on purpose: reads the projects array,
// changes one field on one project, writes it back.
//   node scripts/set-project-status.mjs <projectId> <active|paused|done|archived>
import fs from "node:fs";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}

const [, , projectId, status] = process.argv;
const VALID = ["active", "paused", "done", "archived"];
if (!projectId || !VALID.includes(status)) {
  console.error(`usage: set-project-status.mjs <projectId> <${VALID.join("|")}>`);
  process.exit(1);
}

const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;
if (!url || !token) { console.error("Missing KV credentials"); process.exit(1); }
const headers = { authorization: `Bearer ${token}` };

const res = await fetch(`${url}/get/projects`, { headers });
const { result } = await res.json();
const projects = typeof result === "string" ? JSON.parse(result) : result;

const idx = projects.findIndex((p) => p.id === projectId);
if (idx === -1) { console.error(`No project ${projectId}`); process.exit(1); }

const before = projects[idx].status;
if (before === status) {
  console.log(`${projects[idx].title} is already "${status}" — nothing to do.`);
  process.exit(0);
}
projects[idx] = { ...projects[idx], status, updatedAt: Date.now() };

const set = await fetch(`${url}/set/projects`, {
  method: "POST",
  headers: { ...headers, "content-type": "application/json" },
  body: JSON.stringify(projects),
});
if (!set.ok) { console.error(`Write failed: HTTP ${set.status}`); process.exit(1); }
console.log(`${projects[idx].title}: ${before} -> ${status}`);
