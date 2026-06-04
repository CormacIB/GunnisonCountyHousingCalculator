# Issue 1: Project scaffold + Vercel deployment

**Label:** `ready-for-agent`
**Type:** HITL
**Blocked by:** None — can start immediately

## What to build

Initialize the Next.js application and wire up the full deployment pipeline so that every subsequent slice has a working foundation to build on.

This includes: creating the Next.js project, connecting it to the GitHub repo, creating a Vercel project linked to that repo, and storing the published Google Sheet CSV URLs as Vercel environment variables. A "hello world" page deployed to the Vercel URL confirms the pipeline is working end-to-end.

No Google Cloud project or API key is required. Data is accessed by publishing each Google Sheet tab as CSV ("File → Share → Publish to web → CSV") and storing the resulting URLs as env vars.

## Acceptance criteria

- [ ] Next.js app scaffolded and committed to the repo
- [ ] Vercel project created and linked to the GitHub repo; auto-deploy on push to main is confirmed working
- [ ] A deployed "hello world" page is accessible at the Vercel URL
- [ ] Google Sheet tabs published as CSV via "File → Share → Publish to web"
- [ ] `LISTINGS_CSV_URL` and `AMI_TABLE_CSV_URL` stored as Vercel environment variables
- [ ] Local `.env.local` documented via `.env.local.example` (not committed)

## Blocked by

None — can start immediately
