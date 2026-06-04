# Issue 1: Project scaffold + Vercel deployment

**Label:** `ready-for-agent`
**Type:** HITL
**Blocked by:** None — can start immediately

## What to build

Initialize the Next.js application and wire up the full deployment pipeline so that every subsequent slice has a working foundation to build on.

This includes: creating the Next.js project, connecting it to the GitHub repo, creating a Vercel project linked to that repo, and storing the Google Sheets API key as a Vercel environment variable. A "hello world" page deployed to the Vercel URL confirms the pipeline is working end-to-end.

The Google Cloud project also needs to be created and the Sheets API enabled, with a service account whose credentials are stored in Vercel env vars — so that the Sheets API route in slice 2 can be implemented without credential setup.

## Acceptance criteria

- [ ] Next.js app scaffolded and committed to the repo
- [ ] Vercel project created and linked to the GitHub repo; auto-deploy on push to main is confirmed working
- [ ] A deployed "hello world" page is accessible at the Vercel URL
- [ ] Google Cloud project created with Sheets API v4 enabled
- [ ] Service account credentials (or API key) stored as Vercel environment variables
- [ ] Local `.env.local` documented (but not committed) for development use

## Blocked by

None — can start immediately
