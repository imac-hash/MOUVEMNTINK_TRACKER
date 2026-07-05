import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { stripeClient } from "@/lib/stripe";
import * as store from "@/lib/store";
import { BillingItemStatus } from "@/lib/types";

export const runtime = "nodejs";

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
    case "invoice.paid":
    case "invoice.finalized":
    case "invoice.voided":
    case "invoice.marked_uncollectible":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await store.updateBillingItemStatus(
        invoice.id,
        mapStripeStatus(invoice),
        invoice.hosted_invoice_url ?? undefined
      );
      revalidatePath("/", "layout");
      break;
    }
    default:
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
