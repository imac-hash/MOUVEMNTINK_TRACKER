import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { UpstashRedisAdapter } from "@auth/upstash-redis-adapter";
import { Redis } from "@upstash/redis";
import * as store from "@/lib/store";
import { authConfig } from "./auth.config";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis =
  redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : undefined;

// Full config — used by the auth API route, server components, and server
// actions (all Node.js runtime, not Edge), where Nodemailer and the Redis
// adapter can run. The adapter is still required even with JWT sessions:
// the Email/magic-link provider needs somewhere to persist verification
// tokens and user records.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: redis ? UpstashRedisAdapter(redis) : undefined,
  providers: [
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT || 465),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      // Only people already on the allowlist (owner or added collaborators)
      // can actually sign in — requesting a link doesn't create an account
      // for anyone not already approved.
      return store.isAllowedEmail(user.email);
    },
  },
});
