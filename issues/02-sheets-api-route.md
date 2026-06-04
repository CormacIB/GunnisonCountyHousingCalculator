# Issue 2: Google Sheet template + CSV fetch route

**Label:** `ready-for-agent`
**Type:** AFK
**Blocked by:** Issue 1

## What to build

Create the Google Sheet that serves as the listing database, and implement the Next.js API route that reads from it.

The sheet has two tabs:
- **Tab 1 (Listings):** columns per the agreed schema — `listing_id`, `listing_name`, `type` (rental/ownership), `ami_max_percent`, `ami_min_percent`, `household_size_min`, `household_size_max`, `county_residency_required`, `county_employment_required`, `first_time_buyer_required`, `bedrooms`, `monthly_rent`, `purchase_price`, `status`, `contact_info`, `notes`
- **Tab 2 (AMI Table):** rows = household sizes 1–8, columns = AMI tier percentages (30, 50, 60, 80, 100, 120), values = annual gross income limits in USD for Gunnison County (current HUD figures)

Populate both tabs with realistic sample data (at least 4–5 listings of mixed type and status).

The API route fetches both tabs via their published CSV URLs (from `getEnvConfig()`), parses the CSV into typed `Listing[]` and `AMITable` structures, and returns them as JSON. No Google Cloud project or API key is needed — plain `fetch()` only. Rows where `status !== 'available'` are filtered out before returning.

## Acceptance criteria

- [ ] Google Sheet created with tab 1 (Listings) and tab 2 (AMI Table) matching the agreed schema
- [ ] Tab 2 populated with current Gunnison County AMI figures from HUD
- [ ] At least 4 sample listings added to tab 1 — mix of rental and ownership, some available and some unavailable
- [ ] Next.js API route fetches both tabs using their published CSV URLs via plain `fetch()` (no API key, no Google SDK)
- [ ] Route returns parsed `Listing[]` (available only) and `AMITable` as JSON
- [ ] Unavailable listings are excluded from the response
- [ ] Route is reachable in the local dev server and on the Vercel deployment

## Blocked by

Issue 1 (project scaffold + Vercel deployment + CSV URLs stored as env vars)
