import Stripe from "stripe";
import { BillingItemStatus } from "./types";
import { StripeInvoiceSnapshot } from "./store";

let _stripe: Stripe | null = null;

export function stripeClient(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  _stripe = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
  return _stripe;
}

function mapStripeStatus(invoice: Stripe.Invoice): BillingItemStatus {
  switch (invoice.status) {
    case "paid":
      return "paid";
    case "void":
      return "void";
    case "uncollectible":
      return "uncollectible";
    case "open":
      return "open";
    default:
      return "draft";
  }
}

// The tracker has no first-class "hours" field — Isaac sets it, when he
// wants it shown, as a line-item metadata key in Stripe
// (`metadata.hours`) rather than the app inventing a time-tracking model.
function lineItemHours(line: Stripe.InvoiceLineItem): number | undefined {
  const raw = line.metadata?.hours;
  const hours = Number(raw);
  return raw && !Number.isNaN(hours) ? hours : undefined;
}

// Only field this app requires Isaac to set manually in Stripe: invoice
// metadata `project_id`, matching a Project.id in the tracker. That single
// tag is what lets an invoice created directly in Stripe's dashboard land
// on the right project page here.
export function invoiceProjectId(invoice: Stripe.Invoice): string | undefined {
  return invoice.metadata?.project_id || undefined;
}

export function snapshotFromInvoice(invoice: Stripe.Invoice): StripeInvoiceSnapshot | null {
  const projectId = invoiceProjectId(invoice);
  if (!projectId) return null;
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return null;

  const lineItems = invoice.lines.data.map((line) => ({
    description: line.description || "Line item",
    quantity: line.quantity ?? 1,
    amountCents: line.amount,
    hours: lineItemHours(line),
  }));

  return {
    stripeInvoiceId: invoice.id,
    stripeCustomerId: customerId,
    projectId,
    description: invoice.description || lineItems[0]?.description || "Invoice",
    amountCents: invoice.total,
    currency: invoice.currency,
    status: mapStripeStatus(invoice),
    invoiceNumber: invoice.number ?? undefined,
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? undefined,
    lineItems,
    dueDate: invoice.due_date
      ? new Date(invoice.due_date * 1000).toISOString().slice(0, 10)
      : undefined,
  };
}
