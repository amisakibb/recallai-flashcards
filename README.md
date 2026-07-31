<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ee5ce278-b3fb-4fbf-b2b5-3d89b44430a6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploying to Netlify

The AI features run as **Netlify Functions** (`netlify/functions/`), not as the
Express server — Netlify doesn't run a persistent Node process, so the AI
endpoints will silently 404 in production unless deployed this way.

1. Push this repo to GitHub/GitLab/Bitbucket and import it in Netlify
   ("Add new site" → "Import an existing project").
2. Netlify will read `netlify.toml` automatically:
   - Build command: `npm run build:client`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
3. In **Site configuration → Environment variables**, set:
   - `GEMINI_API_KEY` — your Gemini API key (used server-side by the functions)
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public key
4. Deploy. `/api/ai/*` requests are redirected to the matching function
   (see `netlify.toml`), and `/api/health` should return `{"status":"ok"}`.

## Setting up real accounts (Supabase)

Real login/signup requires a Supabase project — without one configured,
the app only offers offline **Guest Mode** (there is no fake/local login
fallback).

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run everything in [`supabase/schema.sql`](supabase/schema.sql).
   This creates a `user_library` table (decks/cards/profile as JSON) with
   Row Level Security so each user can only ever read or write their own row.
3. Copy your **Project URL** and **anon/public key** from
   Project Settings → API into `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
   (locally in `.env.local`, or in Netlify's environment variables).
4. If your Supabase project has "Confirm email" enabled, new signups will
   need to click the confirmation link before they can log in.
