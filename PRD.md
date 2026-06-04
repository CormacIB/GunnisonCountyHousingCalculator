# PRD: Gunnison County Affordable Housing Calculator

## Problem Statement

Residents of Gunnison County seeking affordable housing have no easy way to know which deed-restricted listings they qualify for. Eligibility is determined by a combination of household income relative to Area Median Income (AMI) tiers, household size, county residency or employment status, and whether the person is renting or buying — criteria that vary by listing and are not intuitively understood by most applicants. Without a tool to match their situation to available inventory, applicants either miss opportunities they qualify for or waste time pursuing listings they don't.

Housing coordinators face the inverse problem: fielding inquiries from applicants who don't yet know whether they qualify, consuming staff time that could be spent on case management.

## Solution

A web-based housing calculator that accepts a user's financial and residency profile and returns only the listings they are currently eligible for. The tool is embeddable on any website via a single `<iframe>` tag, backed by a Google Sheet that housing coordinators can update directly, and requires no login or data submission from the user.

When no matching listings exist, the tool provides a soft landing with actionable next steps (waitlist, housing office contact) rather than a dead end.

## User Stories

1. As a Gunnison County resident, I want to enter my household income and size so that the tool can determine which AMI tier I fall into.
2. As a housing seeker, I want to specify whether I am looking to rent or buy so that I only see relevant listing types.
3. As a housing seeker, I want to indicate whether I currently live or work in Gunnison County so that listings with residency or employment requirements are correctly included or excluded.
4. As a housing seeker, I want to click a single "Find property for me!" button so that I receive a list of listings I qualify for without filling out a lengthy application.
5. As a housing seeker, I want to see matching listings displayed as cards so that I can quickly scan key details like address, rent or price, bedrooms, and AMI tier.
6. As a housing seeker, I want each listing card to show contact information or a link so that I can take immediate action on a match.
7. As a housing seeker, I want to see a helpful message with next steps when no listings match my profile so that I am not left at a dead end.
8. As a housing seeker, I want the tool to work well on my phone so that I can use it from anywhere.
9. As a housing seeker, I want the tool to not store or transmit my personal financial information so that I can use it without privacy concerns.
10. As a housing coordinator, I want to add or update listings by editing a Google Sheet so that I do not need a developer to manage inventory.
11. As a housing coordinator, I want to mark a listing as unavailable in the spreadsheet so that it disappears from results without deleting the row.
12. As a housing coordinator, I want listings to support both rental and ownership types so that the tool covers the full inventory.
13. As a housing coordinator, I want to specify AMI tier requirements per listing (e.g. "max 80% AMI") so that eligibility is enforced automatically.
14. As a housing coordinator, I want to flag whether a listing requires county residency or employment so that ineligible applicants are filtered out.
15. As a housing coordinator, I want to update the Gunnison County AMI income thresholds annually in a second spreadsheet tab so that no code deployment is required when HUD publishes new limits.
16. As a housing coordinator, I want the AMI table to be keyed by household size (1–8 people) and AMI tier percentage so that eligibility calculations remain accurate for all household configurations.
17. As a website administrator, I want to embed the calculator on an existing website using a single `<iframe>` tag so that no custom development is required on the host site.
18. As a website administrator, I want the calculator's visual design to be neutral and generic so that it does not clash with the host site's branding.
19. As a developer, I want the eligibility criteria to be defined in a central config object so that adding a new criterion requires only a config entry and a new spreadsheet column.
20. As a developer, I want the Google Sheets API key to be kept server-side so that credentials are never exposed in client-side code.
21. As a developer, I want the AMI matching logic and eligibility matching logic to be pure functions so that they can be tested in isolation without mocking I/O.

## Implementation Decisions

### Technology Stack
- **Framework:** Next.js (React) hosted on Vercel free tier
- **Data source:** Google Sheets published as CSV (no Google Cloud project or API key required)
- **Embedding:** The deployed Vercel URL is dropped into any host website as a plain `<iframe>`
- **Data access:** Each sheet tab is published via "Publish to web → CSV" and the URL stored as a Vercel environment variable (`LISTINGS_CSV_URL`, `AMI_TABLE_CSV_URL`). Fetched server-side with plain `fetch()` — no auth headers, no Google SDK.

### Google Sheet Schema

**Tab 1 — Listings**

| Column | Type | Notes |
|---|---|---|
| listing_id | string | Unique identifier |
| listing_name | string | Display name / address |
| type | `rental` \| `ownership` | Drives which fields are shown |
| ami_max_percent | number | e.g. `80` for "at or below 80% AMI" |
| ami_min_percent | number | Optional income floor |
| household_size_min | number | Optional |
| household_size_max | number | Optional |
| county_residency_required | boolean | `yes`/`no` |
| county_employment_required | boolean | `yes`/`no` |
| first_time_buyer_required | boolean | Ownership listings only |
| bedrooms | number | |
| monthly_rent | number | Rental listings only |
| purchase_price | number | Ownership listings only |
| status | `available` \| `pending` \| `unavailable` | Only `available` rows are returned |
| contact_info | string | Phone, email, or URL |
| notes | string | Free text shown on the card |

**Tab 2 — AMI Table**

Rows keyed by household size (1–8). Columns for each AMI tier percentage (30, 50, 60, 80, 100, 120). Values are annual gross income limits in USD. Updated annually by the housing coordinator when HUD publishes new Gunnison County limits.

### Module Architecture

**AMI Engine**
- Interface: `getAMIPercent(householdSize: number, annualIncome: number, amiTable: AMITable): number`
- Returns the highest AMI tier percentage the household falls within (e.g. `80` if income is ≤ 80% AMI limit for their household size)
- Pure function; no I/O

**Eligibility Matcher**
- Interface: `matchListings(profile: UserProfile, listings: Listing[], amiPercent: number): Listing[]`
- Iterates the criteria config; filters listings where all criteria pass for the given profile
- Pure function; no I/O

**Criteria Config**
- A typed config array where each entry describes one eligibility criterion: the listing field to check, the profile field to compare against, and the comparison operator
- Adding a new criterion = adding one entry to this array and a corresponding column in the spreadsheet

**Listing Fetcher**
- Calls the Google Sheets API and parses tab 1 into `Listing[]`
- Filters out rows where `status !== 'available'`

**AMI Table Fetcher**
- Calls the Google Sheets API and parses tab 2 into a typed `AMITable` structure keyed by household size and tier percentage

**API Route `/api/match`**
- Accepts `UserProfile` in the request body
- Fetches listings and AMI table (with short-lived server-side cache to avoid hammering Sheets API)
- Runs AMI Engine then Eligibility Matcher
- Returns `MatchedListing[]`

**Calculator Form**
- First question: rent vs. buy toggle
- Subsequent fields: annual household income, household size, county residency (yes/no), county employment (yes/no)
- Client-side validation before submit
- On submit, POSTs to `/api/match`

**Results View**
- Renders a card list when matches exist
- Renders a soft-landing empty state with next steps when no matches exist

**Listing Card**
- Displays: listing name, type badge, bedrooms, rent/price, AMI tier, contact info/link, notes
- One card per matched listing

### UserProfile Shape
```ts
{
  listingType: 'rental' | 'ownership',
  annualIncome: number,
  householdSize: number,
  countyResident: boolean,
  countyEmployee: boolean,
  firstTimeBuyer?: boolean   // only asked when listingType === 'ownership'
}
```

### Caching
The `/api/match` route caches the Sheets response server-side for 5 minutes to reduce API calls. No user data is cached.

## Testing Decisions

Good tests verify external behavior — given inputs X, the output is Y — without asserting on internal implementation details like variable names or intermediate steps.

### AMI Engine
- Unit tests: given known Gunnison County AMI thresholds, assert correct tier returned for a range of income + household size combinations
- Edge cases: income exactly at a tier boundary, household size of 1, household size of 8, income above 120% AMI

### Eligibility Matcher
- Unit tests: given a `UserProfile` and a set of mock listings, assert the correct subset is returned
- Cases to cover: AMI disqualification, residency filter, employment filter, rent vs. buy type filter, first-time buyer filter, listings with no optional restrictions, multiple simultaneous criteria

### Not tested in v1
- Listing Fetcher and AMI Table Fetcher (thin I/O; tested via integration if needed)
- React components (UI behavior; tested manually via the running app)

## Out of Scope

- Admin UI for managing listings (housing coordinator edits Google Sheet directly)
- User account creation, login, or saved searches
- Email or waitlist capture (stateless — no PII stored)
- Anonymous analytics or usage logging
- Near-miss results ("you almost qualify for these listings")
- Visual theming or brand customization for the host website
- PDF or document parsing for listings
- Integration with MLS or any external real-estate data system
- Multi-county or non-Gunnison-County support

## Further Notes

- HUD publishes updated Gunnison County AMI limits annually, typically in spring. The housing coordinator should be reminded to update Sheet tab 2 each year.
- The Google Sheets API has a free quota of 300 reads/minute per project — more than sufficient for this use case, but the 5-minute server-side cache protects against spikes.
- The iframe embedding approach means the host website has no visibility into user inputs. If the host site ever needs to interact with the calculator (e.g. pre-fill fields from a logged-in user profile), a postMessage API can be added as a future enhancement.
- When the real listing data source is identified (e.g. a housing authority database, MLS feed), the Listing Fetcher module is the only layer that needs to change — the AMI Engine, Eligibility Matcher, and all UI components remain unchanged.
