import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Deliberately built from the edge-safe config, not the full auth.ts —
// this file gets bundled for Vercel's Edge Runtime, which can't run
// Nodemailer or the Redis client that the full config depends on.
export default NextAuth(authConfig).auth;

export const config = {
  // Everything requires a session except the auth API routes, the login /
  // verify-request pages, static assets, public read-only share links, the
  // Stripe webhook, and the agent API — Stripe's servers send an
  // unauthenticated POST verified by signature instead of a session cookie,
  // so it must bypass the login gate entirely or Stripe sees a failed
  // delivery and retries. /api/agent is the same shape: a local CLI with no
  // browser, authenticating with a bearer token (see lib/agentAuth.ts), which
  // would otherwise be redirected to /login and never reach its handler.
  matcher: [
    "/((?!api/auth|api/stripe/webhook|api/agent|login|verify-request|share|_next/static|_next/image|favicon).*)",
  ],
};
