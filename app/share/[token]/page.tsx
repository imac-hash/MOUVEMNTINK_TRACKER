import { notFound } from "next/navigation";
import * as store from "@/lib/store";
import { PROJECT_TYPE_LABELS } from "@/lib/types";

export default async function SharePage({ params }: { params: { token: string } }) {
  const project = await store.getProjectByShareToken(params.token);
  if (!project) notFound();

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
      <div>
        <p className="label mb-1">{PROJECT_TYPE_LABELS[project.type]}</p>
        <h1 className="hero text-3xl">{project.title}</h1>
        {project.description && (
          <p className="text-charcoal/60 mt-2">{project.description}</p>
        )}
      </div>

      {project.tasks.length > 0 && (
        <div className="card p-5 space-y-2">
          <h2 className="label mb-1">Tasks</h2>
          {project.tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-sm">
              <span>{t.done ? "☑" : "☐"}</span>
              <span className={t.done ? "line-through text-charcoal/40" : ""}>{t.title}</span>
            </div>
          ))}
        </div>
      )}

      {project.links.length > 0 && (
        <div className="card p-5 space-y-2">
          <h2 className="label mb-1">Links</h2>
          {project.links.map((l, i) => (
            <a key={i} href={l.url} target="_blank" className="block text-sm hover:text-navy">
              {l.label}
            </a>
          ))}
        </div>
      )}

      <p className="text-xs text-charcoal/40 italic font-structural pt-4">
        Shared read-only view — MouvementInk
      </p>
    </div>
  );
}
