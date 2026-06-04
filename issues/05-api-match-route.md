# Issue 5: `/api/match` route with caching

**Label:** `ready-for-agent`
**Type:** AFK
**Blocked by:** Issues 2 and 4

## What to build

Implement the `/api/match` Next.js API route that ties all server-side modules together into a single matchmaking endpoint.

The route accepts a `UserProfile` in the POST request body, fetches listings and the AMI table from Google Sheets (using the fetching logic from Issue 2), runs the AMI Engine to compute the user's AMI tier, runs the Eligibility Matcher to filter listings, and returns the matched listings as JSON.

To avoid hammering the Sheets API on every request, the fetched listings and AMI table are cached server-side for 5 minutes. No user data (the `UserProfile`) is cached — only the Sheets data.

## Acceptance criteria

- [ ] `POST /api/match` accepts a valid `UserProfile` body and returns `Listing[]` (the matched subset)
- [ ] The route calls the AMI Engine and Eligibility Matcher — it does not duplicate any matching logic inline
- [ ] Sheets data (listings + AMI table) is cached server-side for 5 minutes; a second request within the window does not trigger a new Sheets API call
- [ ] No `UserProfile` data is stored, logged, or cached
- [ ] Invalid or missing `UserProfile` fields return a 400 response
- [ ] The route works correctly in both local dev and the Vercel deployment
- [ ] The Google Sheets API key is never included in the response or visible in client-side network requests

## Blocked by

- Issue 2 (Google Sheet template + Sheets API route — provides the data fetching layer)
- Issue 4 (Eligibility Matcher + Criteria Config — provides the matching logic)
