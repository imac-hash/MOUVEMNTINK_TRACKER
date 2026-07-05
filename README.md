# Movement Ink — Projects

Private project tracker. Entities (your businesses, ventures, and personal
creative lane) at the top, projects underneath, and a triage dashboard
(Now / Next / Someday / Waiting) that cuts across all of them so nothing
quietly falls off — including your own art.

Sign-in is magic-link (no passwords): you and anyone you add get a login
link emailed to them. Only people you've explicitly added can sign in at
all — there's no open signup.

## What's in here

- **Entities** — Movement Ink, Daddy Jo, future launches, "Isaac's Art" /
  personal creative, internal apps — whatever top-level lanes you want.
  Only you (the owner) can add or delete entities.
- **Projects** — belong to one entity, have a type (brand system, website,
  marketing brief, business launch, personal creative, internal app,
  template redesign, display ad, email template, production, other), a
  status, and a triage bucket.
- **Triage dashboard** — the home page. Shows everything you have access
  to, grouped by Now/Next/Someday/Waiting, regardless of entity.
- **Tasks & links** — a simple checklist and a links list per project.
- **Collaborators** — you (the owner) add people by email and choose
  exactly which entities they can see and edit. Someone with access to
  only "The Eagle" never sees anything else — not other businesses, not
  your personal projects, not SSDI-related material, nothing.
- **Share links** — beyond real logins, you can also generate a
  no-account, read-only link for a single project — good for a quick
  one-off view without adding someone as a full collaborator.

## Local development

```bash
npm install
cp .env.example .env.local
# edit .env.local — see the comments in that file for each value
npm run dev
```

Without Redis env vars set, project data falls back to a local
`.data/db.json` file for convenience — but the magic-link login will not
work without real Redis credentials, since the Email provider needs
somewhere to store accounts and verification tokens. Set up Upstash
Redis (see below) even for local testing of login.

## Deploying to client.isaacmackay.com

### 1. Push this to a Git repo

```bash
cd movement-ink-tracker
git init
git add .
git commit -m "Initial commit"
```

Push it to a new GitHub repo — private, since this holds business and
personal project data.

### 2. Import into Vercel

- vercel.com → **Add New → Project** → import the repo. Framework
  preset auto-detects as Next.js; leave build settings default.
- Before the first deploy, add these environment variables (Settings →
  Environment Variables):
  - `OWNER_EMAIL` — your email address. This account gets full access
    and can manage entities and collaborators.
  - `AUTH_SECRET` — generate with `npx auth secret` locally and paste
    the result in.
  - `EMAIL_SERVER_HOST` = `smtp.gmail.com`
  - `EMAIL_SERVER_PORT` = `465`
  - `EMAIL_SERVER_USER` = your Gmail address
  - `EMAIL_SERVER_PASSWORD` = a Gmail **App Password** (not your regular
    password — see `.env.example` for the two-step setup)
  - `EMAIL_FROM` = e.g. `Movement Ink <your-gmail-address@gmail.com>`
- Deploy.

### 3. Add persistent storage (Upstash Redis) — required

This isn't optional here: it stores your project data *and* backs the
login system (accounts, sessions, magic-link tokens).

- Vercel project → **Storage** tab → **Marketplace Database Providers**
  → add **Upstash — Redis**.
- Connect it to this project. Vercel automatically sets
  `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — no manual
  entry needed.
- Redeploy so the new env vars take effect.

### 4. Point client.isaacmackay.com at it

- Vercel project → **Settings → Domains** → add
  `client.isaacmackay.com`.
- Add the CNAME (or A record) Vercel gives you wherever
  isaacmackay.com's DNS is managed. Your existing site elsewhere (e.g.
  Bluehost) is untouched — this only affects the one subdomain.
- DNS can take a few minutes to a few hours to propagate.

### 5. Log in and add Dan

- Visit `client.isaacmackay.com`, enter your email, open the link that
  gets emailed to you.
- Go to **Entities** and add your businesses/ventures/personal lane.
- Go to **Collaborators**, add Dan's email, and check the entities he
  should see (e.g. just "The Eagle"). He'll get his own sign-in link the
  first time he logs in with that email — no password to share, no
  account for him to set up in advance.

## Notes on access control

- **You (OWNER_EMAIL)** always see and can edit everything, and are the
  only one who can add/remove entities or collaborators.
- **Collaborators** see and can edit only the entities checked off for
  them — everything else (other entities, and any project inside them)
  simply isn't visible, not just hidden behind a "view only" flag.
- **Share links** are separate from accounts entirely — no login
  required, read-only, single project, revocable any time from that
  project's page.

## What this doesn't do (yet)

- No file uploads — links out to Drive/Figma/etc. instead.
- No due-date reminders or notifications yet.
- Collaborators currently get the same edit rights as you within their
  allowed entities (create/edit/delete projects, tasks, links) — there's
  no "view only" collaborator tier yet. Happy to add one if you need it.
