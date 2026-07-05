import type { NextAuthConfig } from "next-auth";

// Edge-safe config used only by middleware to check "is there a valid
// session" on every request. Deliberately has no providers or adapter —
// those need Node.js APIs (Nodemailer, Redis) that don't run on Vercel's
// Edge Runtime, where middleware executes. Session validation itself
// (reading the signed JWT cookie) doesn't need either.
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
  },
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
