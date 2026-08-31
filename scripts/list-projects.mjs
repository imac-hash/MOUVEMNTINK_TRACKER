#!/usr/bin/env node
// Print every entity/project and its id — the mapping needed to wire a repo's
// .claude/worklog.json marker to an existing project.
import fs from "node:fs";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}

const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error("Missing KV_REST_API_URL / KV_REST_API_TOKEN in .env.local");
  process.exit(1);
}

async function kvGet(key) {
  const res = await fetch(`${url}/get/${key}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (json.result == null) return null;
  return typeof json.result === "string" ? JSON.parse(json.result) : json.result;
}

const entities = (await kvGet("entities")) || [];
const projects = (await kvGet("projects")) || [];
const entityById = Object.fromEntries(entities.map((e) => [e.id, e]));

for (const e of entities) {
  const mine = projects.filter((p) => p.entityId === e.id);
  console.log(`\n${e.name}  [${e.id}]  (${mine.length} projects)`);
  for (const p of mine) {
    const open = p.tasks.filter((t) => !t.done).length;
    const logs = (p.sessionLogs || []).length;
    console.log(
      `   ${p.id}  ${p.status.padEnd(8)} ${p.triage.padEnd(7)} ` +
        `${p.gated ? "gated  " : "       "} ${open} open  ${logs} logs  ${p.title}`
    );
  }
}
const orphans = projects.filter((p) => !entityById[p.entityId]);
if (orphans.length) {
  console.log(`\n(no entity)`);
  for (const p of orphans) console.log(`   ${p.id}  ${p.title}`);
}
console.log(`\n${projects.length} projects across ${entities.length} entities.`);
