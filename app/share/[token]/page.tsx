import { notFound } from "next/navigation";
import * as store from "@/lib/store";
import { isTeaser, shapeProjectForViewer } from "@/lib/visibility";
import { BILLING_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/lib/types";

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default async function SharePage({ params }: { params: { token: string } }) {
  const project = await store.getProjectByShareToken(params.token);
  if (!project) notFound();

  const shaped = shapeProjectForViewer(project, false);
  if (!shaped) notFound();

  if (isTeaser(shaped)) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        <div className="card p-6 space-y-2 border-navy/30 bg-navy/5">
          <h1 className="hero text-3xl">{shaped.title}</h1>
          <p className="text-charcoal italic">{shaped.teaserMessage}</p>
        </div>
        <p className="text-xs text-charcoal/40 italic font-structural pt-4">
          Shared read-only view — MouvementInk
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
      <div>
        <p className="label mb-1">{PROJECT_TYPE_LABELS[shaped.type]}</p>
        <h1 className="hero text-3xl">{shaped.title}</h1>
        {shaped.description && (
          <p className="text-charcoal/60 mt-2">{shaped.description}</p>
        )}
      </div>

      {shaped.tasks.length > 0 && (
        <div className="card p-5 space-y-2">
          <h2 className="label mb-1">Tasks</h2>
          {shaped.tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-sm">
              <span>{t.done ? "☑" : "☐"}</span>
              <span className={t.done ? "line-through text-charcoal/40" : ""}>{t.title}</span>
            </div>
          ))}
        </div>
      )}

      {shaped.links.length > 0 && (
        <div className="card p-5 space-y-2">
          <h2 className="label mb-1">Links</h2>
          {shaped.links.map((l) => (
            <a key={l.id} href={l.url} target="_blank" className="block text-sm hover:text-navy">
              {l.label}
            </a>
          ))}
        </div>
      )}

      {shaped.billingItems.length > 0 && (
        <div className="card p-5 space-y-3">
          <h2 className="label mb-1">Billing</h2>
          {shaped.billingItems.map((b) => (
            <div key={b.id} className="border-b border-line pb-3 last:border-0 last:pb-0 space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <div>
                    {b.description}
                    {b.invoiceNumber && (
                      <span className="text-charcoal/40 text-xs"> · #{b.invoiceNumber}</span>
                    )}
                  </div>
                  <div className="text-xs text-charcoal/50 font-structural mt-0.5">
                    {formatAmount(b.amountCents, b.currency)} · {BILLING_STATUS_LABELS[b.status]}
                    {b.dueDate && ` · due ${b.dueDate}`}
                  </div>
                </div>
                {b.hostedInvoiceUrl && (
                  <a href={b.hostedInvoiceUrl} target="_blank" className="btn-primary text-xs whitespace-nowrap">
                    View & Pay Invoice
                  </a>
                )}
              </div>
              {b.lineItems.length > 0 && (
                <div className="pl-3 border-l-2 border-line space-y-1">
                  {b.lineItems.map((li, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-charcoal/70">
                      <span>
                        {li.description}
                        {li.hours ? ` · ${li.hours}h` : ""}
                        {li.quantity > 1 ? ` × ${li.quantity}` : ""}
                      </span>
                      <span className="font-structural">{formatAmount(li.amountCents, b.currency)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-charcoal/40 italic font-structural pt-4">
        Shared read-only view — MouvementInk
      </p>
    </div>
  );
}
