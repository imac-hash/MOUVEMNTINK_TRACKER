import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { stripeClient, snapshotFromInvoice } from "@/lib/stripe";
import * as store from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "invoice.created":
    case "invoice.updated":
    case "invoice.finalized":
    case "invoice.paid":
    case "invoice.voided":
    case "invoice.marked_uncollectible":
    case "invoice.payment_failed": {
      // Invoices created directly in Stripe's dashboard arrive here with no
      // prior local record — this is the only path that creates a
      // BillingItem, keyed by the invoice's `project_id` metadata.
      const invoice = event.data.object as Stripe.Invoice;
      const snapshot = snapshotFromInvoice(invoice);
      if (snapshot) {
        await store.upsertBillingItemFromStripe(snapshot);
        revalidatePath("/", "layout");
      }
      break;
    }
    default:
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
