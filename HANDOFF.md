# Movement Ink Tracker — Handoff Synopsis

> **Update:** rebranded to **MouvementInk** and restyled to match the
> MouvementInk Document Style Guide v4 (see "Brand / style system" below
> and in the project README). Old dark noir theme is gone — replaced
> with the guide's light charcoal/navy/bone/oxblood palette and the
> DM Sans (hero) / Oswald (structural) / Arial (body) three-font system.
> Montserrat and Inter are banned per the guide and don't appear
> anywhere in this codebase.

## What this is

A private project tracker for Movement Ink, built to replace scattered
chat threads with one place that remembers. Structure: **entities**
(businesses/ventures/personal-art lanes) at the top, **projects**
underneath, with a cross-entity **triage dashboard** (Now/Next/Someday/
Waiting) so nothing — especially personal art — silently falls off the
back of whichever client is loudest that week.

Stack: Next.js 14 (App Router) + Tailwind, deployed to Vercel, data and
auth both backed by Upstash Redis (free tier). No paid services, no
Sanity, no CMS — this is a purpose-built app, not a content site.

## Brand / style system

- Palette: `charcoal #1A1A1A` (text), `navy #101B30` (primary accent),
  `bone #F0E9DC` (highlight bg), `oxblood #3F0813` (rare emphasis only —
  urgency/destructive, not decoration). Defined as Tailwind tokens in
  `tailwind.config.js`.
- Fonts: DM Sans (hero — page titles only, `.hero` class), Oswald
  (structural — nav/labels/meta, `.label` class + `font-structural`),
  Arial (body — default). Loaded via `next/font/google` in
  `app/layout.tsx`, not a CDN link, so there's no way for a banned font
  to sneak in through a copy-pasted snippet later.
- Montserrat and Inter are permanently banned per the style guide —
  confirmed absent from the codebase.
- Full spec lives in the project's own `README.md` under "Brand / style
  system" — check that first before changing colors or fonts.

## What's built and working

- **Entities** — add/delete (owner only), color-coded, typed (business /
  personal_creative / internal_tools / other)
- **Projects** — full CRUD, typed (brand system, website, marketing
  brief, business launch, personal creative, internal app, template
  redesign, display ad, email template, production, other), status,
  triage bucket, due date, tags field (defined but not yet exposed in
  UI), tasks (checklist), links list, notes
- **Triage dashboard** — home page, groups all accessible projects by
  bucket, one-click move between buckets
- **Auth** — magic-link (Auth.js v5 / next-auth beta), no passwords.
  Only pre-approved emails can sign in at all.
- **Access control** — `OWNER_EMAIL` env var = full access + can manage
  entities/collaborators. Collaborators (added via `/collaborators`
  page) get access to only the entities checked off for them —
  enforced both in the UI (filtered lists) and server-side (every
  mutating server action re-checks permission, not just the page
  rendering)
- **Share links** — per-project, no-login, read-only, revocable —
  for one-off viewers who don't need a full account
- Build verified clean (`next build`), auth gating verified at runtime,
  full CRUD cycle verified end-to-end against the local JSON fallback
  store

## Architecture notes worth knowing before you dig in

- `lib/types.ts` — all shared types (Entity, Project, Task, Collaborator)
- `lib/store.ts` — data layer. Auto-switches between local
  `.data/db.json` (dev, no Redis configured) and Upstash Redis
  (production). All entities/projects/collaborators are stored as a
  handful of whole-array JSON blobs under a few keys — fine at this
  scale, would need real indexing if this ever grows to hundreds of
  projects.
- `lib/actions.ts` — all mutations as Next.js Server Actions (not REST
  API routes). Every one calls `requireOwner()` or
  `requireEntityAccess()`/`requireProjectAccess()` before touching data.
- `auth.config.ts` vs `auth.ts` — split deliberately. `auth.config.ts`
  is edge-safe (no providers/adapter) and is what `middleware.ts` uses,
  because Vercel's Edge Runtime can't run Nodemailer or a Node Redis
  client. `auth.ts` has the real config (email provider + Redis
  adapter) and is used everywhere else (server components, the actual
  auth API route). If you ever add a new provider or adapter, it goes
  in `auth.ts`, not `auth.config.ts`.
- Route groups: `app/(gated)/*` = everything behind login (dashboard,
  entities, projects, collaborators). `app/share/[token]` and
  `app/login`, `app/verify-request` sit outside that group — no shared
  header/nav, and `share` is the only fully public route.

## What's NOT built yet (known gaps)

1. **No "view only" collaborator tier** — Dan currently has the same
   edit rights you do within his allowed entities (create/edit/delete
   projects, tasks, links). If you want a read-only mode for some
   collaborators, that's a small addition: add a `role: 'editor' |
   'viewer'` field to `Collaborator`, check it in the mutating actions.
2. **Tags field exists in the data model but isn't exposed in any
   form** — `Project.tags` is defined and typed but there's no UI to
   set or filter by it yet.
3. **No file uploads** — links out to Drive/Figma/etc. only.
4. **No due-date reminders/notifications.**
5. **No bulk actions** (e.g. archive multiple projects at once).
6. **No search** across projects/entities — fine at current scale,
   would matter once you have dozens of projects.
7. **Not yet deployed.** Code is built and tested locally; it has not
   been pushed to Vercel or pointed at `client.isaacmackay.com` yet.

## Immediate next steps, in order

1. **Push to a private GitHub repo.**
2. **Import into Vercel**, set env vars:
   `OWNER_EMAIL`, `AUTH_SECRET` (via `npx auth secret`),
   `EMAIL_SERVER_HOST/PORT/USER/PASSWORD`, `EMAIL_FROM` (Gmail + App
   Password — see `.env.example` for the two-step setup).
3. **Add the Upstash Redis integration** from Vercel's marketplace —
   required for both data storage and login (magic-link tokens need
   somewhere to live). Redeploy after adding it.
4. **Add the CNAME** for `client.isaacmackay.com` in wherever
   isaacmackay.com's DNS is managed, pointing at Vercel.
5. **Log in as owner, add your real entities** (Movement Ink, Daddy Jo,
   Isaac's Art, whatever else), then **add Dan as a collaborator**
   scoped to Eagle only.
6. Decide whether the known gaps above matter enough to build now, or
   later — none of them block getting this live and useful today.

## Files in the zip

Standard Next.js project layout. Root-level `README.md` has the full
step-by-step deploy walkthrough with exact screen-by-screen Vercel
instructions — that's the thing to follow literally for step 2–4 above.
