# Planet, AI plant-health companion

Point a camera at a plant, get a plain-language diagnosis and a low-cost fix. Built for
farmers, home gardeners, and community growers on one platform.

## Stack

React + Vite (PWA) · Tailwind v4 · Supabase (Postgres, Auth, Storage, Edge Functions) ·
Dexie (offline queue) · pluggable vision AI (Claude / OpenAI / Gemini)

## Two ways to use it

The app opens on an intro page with two choices, and nothing else runs until one is
picked (`src/lib/mode.tsx` holds the choice, in `localStorage`):

- **Easy demo**: no account, no backend. The visitor pastes their own Claude, OpenAI, or
  Gemini API key, which is used to call that vendor directly from the browser
  (`src/lib/clientDiagnose.ts`) and is never sent anywhere else or persisted, it's gone on
  refresh. Only the Diagnose page exists in this mode; nothing is saved, not even
  locally. This mode needs no Supabase project at all.
- **Full platform**: the original experience. An anonymous Supabase session, reports
  saved to Postgres and Storage, the community feed, growth tracking, care calendar, and
  the Settings page for the shared operator-configured AI provider. This mode does need a
  real Supabase project (see below).

## Project layout

```
src/
  components/   PhotoCapture, DiagnosisCard, NavBar, OfflineBanner, PlantOrbit
  hooks/        useOnlineStatus
  lib/          supabase.ts, db.ts (Dexie), api.ts, clientDiagnose.ts, mode.tsx,
                functions.ts, settings.ts, sync.ts, types.ts
  pages/        IntroPage, DiagnosePage, CareCalendarPage, CommunityPage, GrowthPage,
                SettingsPage
supabase/
  migrations/           Postgres schema: reports, secrets, app_config, storage policies
  functions/
    diagnose-plant/       looks up the active AI provider and calls its vision API
    get-provider-status/  save-api-key/  clear-api-key/  set-active-provider/
    _shared/               types.ts, schema.ts, providers/ (claude.ts, openai.ts, gemini.ts)
```

## Setup

Nothing to configure to try the demo, `npm install && npm run dev` and pick "Easy demo"
on the intro page.

For the full platform, see **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** for the full
walkthrough (creating the Supabase project, pushing the schema, deploying functions).

## Deploy

```
npx supabase db push
npx supabase functions deploy
npm run build   # then host dist/ wherever you like (Vercel, Netlify, Cloudflare Pages, ...)
```

## Bring-your-own AI provider (full platform)

This is the operator-facing mechanism for the full platform, separate from the demo's
own per-visitor key entry described above. There's no hardcoded model.
`supabase/functions/_shared/providers/index.ts` holds a
`PROVIDERS` map (currently Claude, OpenAI/ChatGPT, Gemini). Each is a small adapter with
the same signature: `(apiKey, imageBase64, mimeType) => Promise<Diagnosis>`. API keys are
entered through the app's **Settings** page (not `.env`, not Supabase secrets) and stored
in a `secrets` Postgres table that Row Level Security makes unreadable/unwritable from
any client. Only Edge Functions using the service_role key can touch it. The Settings
page shows each provider's status (green dot = active, yellow = key saved but not active,
red = no key) and lets you switch the active provider instantly, no redeploy required.

To add another vendor: write a new file in `supabase/functions/_shared/providers/`
matching the same signature, register it in the `PROVIDERS` map, redeploy functions
(`npx supabase functions deploy`). It appears in Settings automatically.

## Known local-environment issue (Windows)

`npm run build` may fail at the `vite-plugin-pwa` step with an `ERR_DLOPEN_FAILED` /
"file contains a virus or potentially unwanted software" / "cannot find module" error
mentioning `@rollup/rollup-win32-x64-msvc`. This is Windows Defender false-flagging (and
sometimes deleting) that Rollup native binary, a known npm/Windows issue
(https://github.com/npm/cli/issues/4828), not a code issue. `npm run dev` is unaffected
since it doesn't use Rollup. To fix the production build, add a Windows Defender
exclusion for the project's `node_modules` folder (or your antivirus equivalent), then
reinstall: `rm -rf node_modules/@rollup && npm install`.

## What's stubbed vs. real

- **Tier 1** (photo upload, AI diagnosis, plain-language fix): wired end-to-end through
  Edge Functions.
- **Offline-first**: photos taken offline are queued in IndexedDB (Dexie) and flushed
  automatically when connectivity returns (`src/lib/sync.ts`).
- **Community layer**: currently aggregates category counts from recent reports in
  Postgres; geohash-based "near you" filtering and the Leaflet map are not wired up yet
  (packages are installed: `leaflet`, `react-leaflet`).
- **Care calendar**: UI and local storage exist; automatic reminder generation from a
  diagnosis (e.g. "water in 2 days") is not implemented yet.
- **Growth tracking**: groups synced reports by plant name into a photo timeline.
- **Weather alerts, biodiversity suggestions**: not started.

## License

MIT, see [LICENSE](LICENSE).
