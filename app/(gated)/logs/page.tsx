import Link from "next/link";
import { auth } from "@/auth";
import * as store from "@/lib/store";
import { ENTITY_COLOR_HEX } from "@/lib/types";

// Filters live in the URL so a given day or search is a shareable, bookmarkable
// address rather than component state that evaporates on reload.
interface LogsPageProps {
  searchParams: { q?: string; day?: string; project?: string };
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatDayHeading(day: string): string {
  // Parse as local noon so the label can never slide a day from a UTC parse.
  const d = new Date(`${day}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const session = await auth();
  if (!store.isOwnerEmail(session?.user?.email)) {
    return (
      <div className="card p-10 text-center space-y-2">
        <p className="label">Not available</p>
        <p className="text-charcoal">Session logs are owner-only.</p>
      </div>
    );
  }

  const [logs, entities] = await Promise.all([
    store.getAllSessionLogs(),
    store.getEntities(),
  ]);
  const entityById = Object.fromEntries(entities.map((e) => [e.id, e]));

  const q = (searchParams.q || "").trim().toLowerCase();
  const day = (searchParams.day || "").trim();
  const projectFilter = (searchParams.project || "").trim();

  const filtered = logs.filter((l) => {
    if (day && l.day !== day) return false;
    if (projectFilter && l.projectId !== projectFilter) return false;
    if (!q) return true;
    const haystack = [
      l.summary,
      l.body || "",
      l.phase || "",
      l.projectTitle,
      l.tasksTouched.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  const totalMinutes = filtered.reduce((sum, l) => sum + l.durationMin, 0);

  const byDay = filtered.reduce<Record<string, typeof filtered>>((acc, l) => {
    (acc[l.day] ||= []).push(l);
    return acc;
  }, {});
  const days = Object.keys(byDay).sort().reverse();

  const projectOptions = Array.from(
    new Map(logs.map((l) => [l.projectId, l.projectTitle])).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const hasFilters = Boolean(q || day || projectFilter);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="hero text-2xl">Work log</h1>
        <span className="label">
          {filtered.length} {filtered.length === 1 ? "session" : "sessions"} ·{" "}
          {formatDuration(totalMinutes)}
        </span>
      </div>

      <form
        method="GET"
        className="card p-4 mb-8 flex flex-col md:flex-row gap-3 md:items-end"
      >
        <div className="flex-1">
          <label htmlFor="q" className="label block mb-1">
            What we did
          </label>
          <input
            id="q"
            name="q"
            defaultValue={searchParams.q || ""}
            placeholder="stripe, gating, dns…"
            className="w-full border border-line bg-bone px-3 py-2 text-sm focus:outline-none focus:border-navy"
          />
        </div>
        <div>
          <label htmlFor="day" className="label block mb-1">
            Day
          </label>
          <input
            id="day"
            name="day"
            type="date"
            defaultValue={searchParams.day || ""}
            className="border border-line bg-bone px-3 py-2 text-sm focus:outline-none focus:border-navy"
          />
        </div>
        <div>
          <label htmlFor="project" className="label block mb-1">
            Project
          </label>
          <select
            id="project"
            name="project"
            defaultValue={searchParams.project || ""}
            className="border border-line bg-bone px-3 py-2 text-sm focus:outline-none focus:border-navy"
          >
            <option value="">All projects</option>
            {projectOptions.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary">Search</button>
          {hasFilters && (
            <Link
              href="/logs"
              className="px-3 py-2 text-sm border border-line hover:border-navy transition-colors self-stretch flex items-center"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center space-y-2">
          <p className="label">Nothing logged{hasFilters ? " for that filter" : " yet"}.</p>
          <p className="text-charcoal/70 text-sm">
            {hasFilters
              ? "Try a broader search, or clear the filters."
              : "Logs land here automatically when a session wraps in a tracked repo."}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {days.map((d) => {
            const dayLogs = byDay[d];
            const dayMinutes = dayLogs.reduce((s, l) => s + l.durationMin, 0);
            return (
              <section key={d}>
                <div className="flex items-baseline justify-between border-b border-line pb-2 mb-4">
                  <h2 className="font-structural uppercase tracking-wide text-sm text-navy">
                    {formatDayHeading(d)}
                  </h2>
                  <span className="label">{formatDuration(dayMinutes)}</span>
                </div>
                <div className="space-y-4">
                  {dayLogs.map((l) => {
                    const entity = entityById[l.entityId];
                    return (
                      <article key={`${l.projectId}-${l.id}`} className="card p-5">
                        <div className="flex items-baseline justify-between gap-4 mb-2">
                          <div className="flex items-baseline gap-2 min-w-0">
                            {entity && (
                              <span
                                className="inline-block w-2 h-2 shrink-0 rounded-full"
                                style={{ backgroundColor: ENTITY_COLOR_HEX[entity.color] }}
                                aria-hidden="true"
                              />
                            )}
                            <Link
                              href={`/projects/${l.projectId}`}
                              className="font-structural uppercase tracking-wide text-xs text-charcoal/60 hover:text-navy transition-colors truncate"
                            >
                              {l.projectTitle}
                            </Link>
                            {l.phase && (
                              <span className="text-xs text-charcoal/40 truncate">
                                / {l.phase}
                              </span>
                            )}
                          </div>
                          <span className="label shrink-0">{formatDuration(l.durationMin)}</span>
                        </div>

                        <p className="text-charcoal leading-snug mb-3">{l.summary}</p>

                        {l.body && (
                          <details className="group">
                            <summary className="label cursor-pointer hover:text-navy transition-colors list-none">
                              <span className="group-open:hidden">Show detail</span>
                              <span className="hidden group-open:inline">Hide detail</span>
                            </summary>
                            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-charcoal/80 leading-relaxed border-l-2 border-line pl-4">
                              {l.body}
                            </pre>
                          </details>
                        )}

                        {l.tasksTouched.length > 0 && (
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {l.tasksTouched.map((t, i) => (
                              <li
                                key={i}
                                className="text-xs border border-line px-2 py-0.5 text-charcoal/70"
                              >
                                {t}
                              </li>
                            ))}
                          </ul>
                        )}

                        <p className="mt-3 text-xs text-charcoal/35 font-mono truncate">
                          {l.filePath}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
