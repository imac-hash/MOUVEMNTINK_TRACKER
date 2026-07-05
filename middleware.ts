import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Deliberately built from the edge-safe config, not the full auth.ts —
// this file gets bundled for Vercel's Edge Runtime, which can't run
// Nodemailer or the Redis client that the full config depends on.
export default NextAuth(authConfig).auth;

export const config = {
  // Everything requires a session except the auth API routes, the login /
  // verify-request pages, static assets, public read-only share links, and
  // the Stripe webhook — Stripe's servers send an unauthenticated POST
  // verified by signature instead of a session cookie, so it must bypass
  // the login gate entirely or Stripe sees a failed delivery and retries.
  matcher: [
    "/((?!api/auth|api/stripe/webhook|login|verify-request|share|_next/static|_next/image|favicon).*)",
  ],
};
