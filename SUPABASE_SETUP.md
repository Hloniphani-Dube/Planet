# Migrating the app onto Supabase

This only applies to the **full platform** mode. The app's other mode, the easy demo,
runs entirely in the browser against a visitor-supplied API key and needs none of this,
see the README's "Two ways to use it" section. This is the checklist for taking the full
platform from "runs with nothing configured" to "fully connected to a real Supabase
project." Follow it top to bottom the first time; after that, only the "day-to-day"
section at the bottom applies.

## 0. What you'll end up with

- A Supabase project (Postgres database + Auth + Storage + Edge Functions).
- The project's URL and anon key in a local `.env` file (safe to have on your machine,
  not committed. The anon key is meant to be public-ish, it's what RLS policies exist
  to guard).
- No AI API key stored anywhere in the codebase or `.env`. Those are entered through the
  app's **Settings** page after it's deployed, and live only in a Postgres table that
  Row Level Security makes unreadable to every client role. Only Edge Functions using the
  service_role key can read it. Paste in a Claude key, an OpenAI key, a Gemini key, or all
  three, and switch which one is "active" at any time, no redeploy needed.

## 1. Prerequisites

- A Supabase account (supabase.com).
- Node.js installed (already the case if you've run this project).
- Supabase CLI, already a dev dependency of this repo (`npx supabase ...`). No global
  install needed.
- Docker Desktop, **only if** you want to run Supabase locally for development
  (`supabase start`). Not required just to deploy to a real project.

## 2. Create the Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Pick an organization, name it (e.g. "planet-i-green"), set a database password (save it
   somewhere, you likely won't need it day-to-day since the app talks to Postgres
   through Supabase's APIs, not a raw connection string), and pick a region close to your
   users.
3. Wait for provisioning (a minute or two).

Supabase's free tier includes Postgres, Auth, Storage, and Edge Functions with generous
limits. A hackathon demo will very likely cost $0.

## 3. Connect the app to the project

1. In the project dashboard: **Project Settings → Data API** for the project URL, and
   **Project Settings → API Keys** for the `anon` `public` key.
2. Copy `.env.example` to `.env` and fill in:

   | `.env` key | where to find it |
   |---|---|
   | `VITE_SUPABASE_URL` | Project Settings → Data API → Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Project Settings → API Keys → `anon` `public` |

   This file is gitignored, so every teammate needs their own copy (same values are fine to
   share within the team; the anon key is protected by the RLS policies in the migration,
   not by secrecy).
3. Link the CLI to this project so migrations and function deploys know where to go:
   ```
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   ```
   The project ref is the string in your project's dashboard URL
   (`supabase.com/dashboard/project/<ref>`).

## 4. Turn on anonymous sign-ins

**Authentication → Sign In / Providers** (or **Authentication → Settings** depending on
dashboard version), enable **Allow anonymous sign-ins**. This is what lets someone use
the app with no signup screen, same as before.

## 5. Push the database schema

The schema lives in `supabase/migrations/`, applied in order:

1. `..._init_schema.sql` creates `plants` (private to their owner), `reports` (plant
   diagnoses, publicly readable, insert/update/delete restricted to the reporting user),
   `report_reactions`, `secrets` and `app_config` (API keys and the active-provider
   setting, locked out for every client role via RLS with no policies, service_role
   only), and the `plant-photos` storage bucket with matching policies.
2. `..._feature_expansion.sql` is additive (`add column if not exists`), so it is safe on
   a project that already has data. It adds a care profile to plants; severity score,
   companion tip, native alternative, care tasks and geohash to reports; indexes for the
   community map; and rounds any older exact coordinates to about 1 km.

```
npx supabase db push
```

This applies the migration to your real project. (If you want to iterate on the schema
locally first, `npx supabase start` spins up the full stack in Docker, `npx supabase db
diff` generates new migration files from local changes.)

## 6. Deploy the Edge Functions

```
npx supabase functions deploy
```

This deploys all six functions in `supabase/functions/`: `diagnose-plant` (checks the
caller is signed in, looks up whichever provider is active and calls that vendor's vision
API), and
`get-provider-status` / `save-api-key` / `clear-api-key` / `set-active-provider` / `test-api-key` (the
Settings page's backend). Nothing needs an API key yet, that happens in the app, next.
No build step is needed. Deno resolves the `npm:` package imports at deploy time.

## 7. Build and deploy the web app

The frontend isn't tied to Supabase Hosting specifically. Deploy `dist/` anywhere
static (Vercel, Netlify, Cloudflare Pages, GitHub Pages, or Supabase's own storage-backed
hosting if you set that up separately).

```
npm run build
```

> **Windows note:** if this fails at the `vite-plugin-pwa` step with an
> `ERR_DLOPEN_FAILED` / "file contains a virus" / "cannot find module" error mentioning
> `@rollup/rollup-win32-x64-msvc`, that's Windows Defender false-flagging (and sometimes
> deleting) a Rollup native binary, a known npm/Windows issue, not a code issue. It
> doesn't affect `npm run dev` or the deployed functions. Fix: add a Defender exclusion
> for the project's `node_modules` folder, then `rm -rf node_modules/@rollup && npm
> install`.

Then deploy the `dist/` folder with whichever static host you picked, or run `npm run
dev` locally against the real Supabase project for testing.

**Installing as an app.** The service worker and the browser's "install" prompt only work
over HTTPS (every host above provides it) and only in a production build, not
`npm run dev`. The install icons are PNGs in `public/`; regenerate them with `node
scripts/generate-icons.mjs` if you change the design.

**Nothing else to configure for the new features.** Weather alerts use Open-Meteo and
place search uses Open-Meteo's geocoder (both free, no key), and the community map draws
OpenStreetMap tiles. Keep the OpenStreetMap attribution the map already shows, and
consider a tile provider of your own if you expect heavy traffic (their tile usage policy
is meant for light use).

## 8. Add an API key and go live

1. Open the app and go to **Settings**.
2. Paste in an API key for whichever provider you have: Claude
   (console.anthropic.com), OpenAI (platform.openai.com), or Gemini
   (aistudio.google.com/app/apikey), and hit **Save**.
3. Click **Set active** on that provider. The status dot turns green.
4. Go to **Scan** and try a photo. If it fails with "No AI provider is set up yet,"
   you skipped step 2 or 3.

You can add keys for more than one provider and switch the active one anytime from
Settings. Useful for comparing model quality live during judging, or as a fallback if
one vendor's API is rate-limited or down.

## Security note (read before a real launch)

Right now, any signed-in user (including anonymous ones, i.e. anyone who opens the app)
can call `save-api-key` / `set-active-provider`. That's intentional for a hackathon build,
it's what makes the Settings page self-serve with zero backend config, but it means
anyone with the deployed URL could overwrite your API key or switch providers. Before a
real launch, gate those functions behind an admin check: add a `role` claim to the user's
JWT (via a Postgres trigger or an Admin API call setting `app_metadata`), and check it at
the top of each function via `getUserFromRequest` before proceeding.
`diagnose-plant` doesn't need that admin gate because it only reads keys, never writes them,
but it does require a signed-in session (anonymous counts), so the deployed key can't be
spent by a caller who has nothing but the URL.

## Day-to-day (after initial setup)

- Changed an Edge Function? `npx supabase functions deploy <name>` (or no name to deploy
  all).
- Changed the database schema? Add a new file with `npx supabase migration new
  <description>`, edit it, then `npx supabase db push`.
- Changed frontend code? `npm run build`, then redeploy `dist/` to your static host.
- Added a new AI provider adapter (see `supabase/functions/_shared/providers/`)? Add it
  to the `PROVIDERS` map in `supabase/functions/_shared/providers/index.ts`, redeploy
  functions. It shows up in Settings automatically, no frontend changes needed.
