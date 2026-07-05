import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Deliberately built from the edge-safe config, not the full auth.ts —
// this file gets bundled for Vercel's Edge Runtime, which can't run
// Nodemailer or the Redis client that the full config depends on.
export default NextAuth(authConfig).auth;

export const config = {
  // Everything requires a session except the auth API routes, the login /
  // verify-request pages, static assets, and public read-only share links.
  matcher: [
    "/((?!api/auth|login|verify-request|share|_next/static|_next/image|favicon).*)",
  ],
};
