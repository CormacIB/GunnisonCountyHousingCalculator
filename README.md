# Gunnison County Housing Calculator

A stateless, embeddable eligibility calculator that matches Gunnison County residents to affordable housing listings based on their income, household size, and residency status.

Built with Next.js and deployed on Vercel. Designed to be embedded as an `<iframe>` on any website, with listing data managed entirely via Google Sheets — no database required.

---

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Matching Logic](#matching-logic)
  - [AMI Calculation](#ami-calculation)
  - [Eligibility Criteria](#eligibility-criteria)
  - [Criterion Evaluation](#criterion-evaluation)
  - [Adding New Criteria](#adding-new-criteria)
- [Data Layer](#data-layer)
  - [Listings Sheet](#listings-sheet)
  - [AMI Table Sheet](#ami-table-sheet)
  - [CSV Parsing](#csv-parsing)
  - [Caching](#caching)
- [API Reference](#api-reference)
  - [POST /api/match](#post-apimatch)
  - [GET /api/listings](#get-apilistings)
- [Frontend](#frontend)
- [Setup](#setup)
- [Embedding](#embedding)
- [Testing](#testing)
- [Architecture Decisions](#architecture-decisions)

---

## Overview

Housing coordinators maintain two Google Sheets tabs: one for available listings and one for the HUD AMI (Area Median Income) table. When a user submits the form, the calculator:

1. Fetches those sheets (with a 5-minute server-side cache)
2. Classifies the user's household into an AMI tier
3. Filters listings against six eligibility criteria
4. Returns cards for every matching listing

No user data is stored. The tool is intentionally stateless.

---

## How It Works

```
User fills form
      │
      ▼
POST /api/match
      │
      ├─► Fetch + cache Google Sheets CSVs
      │         (LISTINGS_CSV_URL, AMI_TABLE_CSV_URL)
      │
      ├─► Calculate user's AMI percent
      │         getAMIPercent(householdSize, annualIncome, amiTable)
      │
      ├─► Filter listings
      │         matchListings(userProfile, listings, amiPercent)
      │         (every criterion must pass — AND logic)
      │
      └─► Return matched Listing[]
```

---

## Matching Logic

The matching logic lives in two files:

- [`src/lib/ami-engine.ts`](src/lib/ami-engine.ts) — classifies the user's income into an AMI tier
- [`src/lib/eligibility-matcher.ts`](src/lib/eligibility-matcher.ts) — filters listings against eligibility criteria

Both are pure functions with no I/O, making them independently testable.

### AMI Calculation

**File:** [`src/lib/ami-engine.ts`](src/lib/ami-engine.ts)

The HUD publishes annual income limits for each AMI tier (30%, 50%, 60%, 80%, 100%, 120%) broken down by household size. These limits are stored in the AMI Table Google Sheet and fetched at runtime.

`getAMIPercent(householdSize, annualIncome, amiTable)` returns the **lowest AMI tier the household's income falls within**.

**Algorithm:**

```
tiers = [30, 50, 60, 80, 100, 120]

for each tier in tiers (ascending):
    limit = amiTable[householdSize][tier]
    if annualIncome <= limit:
        return tier

return 121   // OVER_INCOME_AMI — income exceeds 120% limit
```

The tiers are checked in ascending order so the household is assigned the most restrictive (lowest) tier they qualify for. This ensures they aren't excluded from listings that serve lower-income households.

**Example:**

For a 4-person household earning $62,000/year, with the following limits:

| Tier | 4-Person Limit |
|------|----------------|
| 30%  | $28,000        |
| 50%  | $46,000        |
| 60%  | $55,200        |
| 80%  | $73,600        |
| 100% | $92,000        |
| 120% | $110,400       |

$62,000 exceeds the 60% limit ($55,200) but is below the 80% limit ($73,600), so `getAMIPercent` returns **80**.

A listing with `ami_max_percent = 80` would be eligible for this household. A listing with `ami_max_percent = 60` would not.

**Over-income sentinel:** If the household's income exceeds the 120% limit, the function returns `121`. This constant (`OVER_INCOME_AMI`) is exported and used in tests to assert over-income behavior. Any listing with `ami_max_percent < 121` will correctly exclude this household.

**Missing tier data:** If the AMI table does not contain a limit for the requested household size and tier, that tier is skipped. This prevents a missing data point from incorrectly matching a household.

---

### Eligibility Criteria

**File:** [`src/lib/eligibility-matcher.ts`](src/lib/eligibility-matcher.ts)

`matchListings(profile, listings, amiPercent)` applies a fixed array of criteria to every listing and returns those where **all criteria pass**.

The six criteria, in evaluation order:

#### Criterion 1 — Listing Type

```
listing.type === profile.listingType
```

The user selects either "rental" or "ownership" (rent vs. buy). A listing only matches if its type field exactly matches the user's selection. This is the coarsest filter and eliminates roughly half the listings immediately.

#### Criterion 2 — AMI Maximum Ceiling

```
amiPercent <= listing.ami_max_percent
```

Every listing has a maximum AMI percentage. The user's AMI tier must be **at or below** this ceiling. This prevents households with too much income from accessing listings reserved for lower-income households.

Example: A household at 80% AMI is eligible for a listing capped at 100% AMI, but not one capped at 60% AMI.

#### Criterion 3 — AMI Minimum Floor

```
listing.ami_min_percent === undefined  OR  amiPercent >= listing.ami_min_percent
```

Some listings have a minimum AMI to ensure the unit is not allocated to a household that could not realistically afford it even with assistance. If the listing has no minimum defined, this criterion always passes. If a minimum is set, the user's AMI tier must be **at or above** the floor.

Example: A listing with `ami_min_percent = 50` excludes households at the 30% AMI tier.

#### Criterion 4 — County Residency

```
!listing.county_residency_required  OR  profile.countyResident === true
```

If a listing requires the applicant to currently live in Gunnison County, only users who answered "yes" to the residency question pass this criterion. If the listing has no residency requirement, this criterion always passes.

#### Criterion 5 — County Employment

```
!listing.county_employment_required  OR  profile.countyEmployee === true
```

If a listing requires the applicant to work in Gunnison County, only users who answered "yes" to the employment question pass this criterion. If the listing has no employment requirement, this criterion always passes.

#### Criterion 6 — First-Time Buyer

```
!listing.first_time_buyer_required  OR  profile.firstTimeBuyer === true
```

Only relevant for ownership listings. If a listing requires the buyer to be a first-time homebuyer, only users who answered "yes" pass. Rental listings typically have `first_time_buyer_required = false`, so this criterion is a no-op for rentals in practice. If `firstTimeBuyer` is undefined on the profile (user did not answer because they selected "rent"), a listing with `first_time_buyer_required = true` will **not** match — `undefined === true` is false.

---

### Criterion Evaluation

All criteria are evaluated using a `Criterion` type:

```typescript
type Criterion = {
  passes: (profile: UserProfile, listing: Listing, amiPercent: number) => boolean;
};

const CRITERIA: Criterion[] = [
  { passes: (p, l)       => l.type === p.listingType },
  { passes: (_p, l, ami) => ami <= l.ami_max_percent },
  { passes: (_p, l, ami) => l.ami_min_percent === undefined || ami >= l.ami_min_percent },
  { passes: (p, l)       => !l.county_residency_required || p.countyResident },
  { passes: (p, l)       => !l.county_employment_required || p.countyEmployee },
  { passes: (p, l)       => !l.first_time_buyer_required || p.firstTimeBuyer === true },
];
```

`matchListings` is then:

```typescript
function matchListings(profile, listings, amiPercent) {
  return listings.filter(listing =>
    CRITERIA.every(criterion => criterion.passes(profile, listing, amiPercent))
  );
}
```

This is a pure AND gate across all criteria. A listing must pass every criterion to appear in results. There is no partial matching or ranking — either a listing is eligible or it is not.

---

### Adding New Criteria

To add an eligibility criterion:

1. Add a column to the Listings Google Sheet (e.g., `veteran_preference_required`)
2. Add the column to the `Listing` type in [`src/lib/csv-parsers.ts`](src/lib/csv-parsers.ts) and parse it as a boolean
3. Add a field to `UserProfile` in [`src/lib/eligibility-matcher.ts`](src/lib/eligibility-matcher.ts)
4. Add a new entry to `CRITERIA`:
   ```typescript
   { passes: (p, l) => !l.veteran_preference_required || p.isVeteran === true }
   ```
5. Add the corresponding form field to [`src/app/page.tsx`](src/app/page.tsx)
6. Add validation for the new field in [`src/app/api/match/route.ts`](src/app/api/match/route.ts)
7. Write a unit test in [`src/lib/__tests__/eligibility-matcher.test.ts`](src/lib/__tests__/eligibility-matcher.test.ts)

---

## Data Layer

### Listings Sheet

The primary listing data is stored in a Google Sheet and published as a CSV. Each row is one listing. The CSV parser expects these columns (flexible naming — see aliases below):

| Column | Type | Description |
|--------|------|-------------|
| `listing_id` | string | Unique identifier |
| `listing_name` | string | Display name shown on the card |
| `type` | `rental` \| `ownership` | Listing type |
| `status` | `available` \| `pending` \| `unavailable` | Only `available` rows are returned |
| `ami_max_percent` | number | Maximum AMI tier (e.g., 80) |
| `ami_min_percent` | number (optional) | Minimum AMI tier |
| `county_residency_required` | boolean | Requires living in Gunnison County |
| `county_employment_required` | boolean | Requires working in Gunnison County |
| `first_time_buyer_required` | boolean | Requires first-time buyer status |
| `bedrooms` | number | Number of bedrooms |
| `monthly_rent` | number (optional) | Monthly rent in dollars |
| `purchase_price` | number (optional) | Purchase price in dollars |
| `contact_info` | string | Contact information for the listing |
| `notes` | string (optional) | Additional information |

**Column name aliases:** The parser normalizes column headers to lowercase and trims whitespace, then matches on aliases. For example, "Type", "property type", and "Listing Type" all map to the `type` field. Boolean fields accept "yes"/"no", "true"/"false", and "1"/"0". Price fields accept values with `$` and `,` (e.g., "$1,200" → 1200).

**Filtering:** Rows where `status !== "available"` or `ami_max_percent` is not a valid number are silently dropped before matching.

### AMI Table Sheet

The AMI table is stored in a second tab of the same Google Sheet (or a separate sheet), also published as a CSV. The parser supports two orientations:

**Format A — Tiers as rows:**
```
AMI Tier | 1-Person | 2-Person | 3-Person | 4-Person | ...
30%      | $18,000  | $20,600  | $23,150  | $25,750  | ...
50%      | $30,000  | $34,300  | $38,600  | $42,900  | ...
```

**Format B — Household sizes as rows:**
```
Household | 30%     | 50%     | 60%     | 80%     | ...
1-person  | $18,000 | $30,000 | $36,000 | $48,000 | ...
2-person  | $20,600 | $34,300 | $41,160 | $54,880 | ...
```

The parser auto-detects the orientation by examining whether the first column header looks like an AMI percentage or a household size descriptor. The AMI table should be updated annually when HUD publishes new limits.

### CSV Parsing

**File:** [`src/lib/csv-parsers.ts`](src/lib/csv-parsers.ts)

The parser uses a custom tokenizer rather than a third-party library. Key behaviors:

- **Header auto-detection:** Scans rows from the top until it finds one where at least 3 cells are non-numeric. This handles Google Sheets title rows that appear above the actual data headers.
- **Quoted field support:** Correctly handles fields containing commas when wrapped in double quotes (e.g., `"Smith, John"`).
- **Robust boolean parsing:** "yes", "true", "1", "x" → `true`; anything else → `false`.
- **Currency stripping:** Removes `$`, `,`, and `%` before parsing numbers.

### Caching

**File:** [`src/app/api/match/route.ts`](src/app/api/match/route.ts)

To avoid hitting Google Sheets on every request, the route handler maintains an in-memory cache with a 5-minute TTL:

```typescript
let cache: { data: SheetData; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getSheetData(): Promise<SheetData> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }
  const data = await fetchSheetData();
  cache = { data, fetchedAt: Date.now() };
  return data;
}
```

Each underlying `fetch()` call also includes `next: { revalidate: 300 }` so Next.js's data cache holds the raw CSV response for 5 minutes.

Note: This cache is per-server-instance. If the app scales horizontally, each instance maintains its own cache independently — this is acceptable given the low-stakes nature of the data (housing listings, not financial transactions).

---

## API Reference

### POST /api/match

Returns listings that match the submitted user profile.

**Request body:**

```json
{
  "listingType": "rental",
  "annualIncome": 62000,
  "householdSize": 4,
  "countyResident": true,
  "countyEmployee": false,
  "firstTimeBuyer": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `listingType` | `"rental"` \| `"ownership"` | Yes | Whether the user is looking to rent or buy |
| `annualIncome` | number ≥ 0 | Yes | Annual household income in dollars |
| `householdSize` | number ≥ 1 | Yes | Number of people in the household |
| `countyResident` | boolean | Yes | Whether the user currently lives in Gunnison County |
| `countyEmployee` | boolean | Yes | Whether the user currently works in Gunnison County |
| `firstTimeBuyer` | boolean \| null | No | Whether the user is a first-time homebuyer (only relevant for ownership) |

**Response (200):**

```json
[
  {
    "listing_id": "abc123",
    "listing_name": "Riverwalk Apartments Unit 4B",
    "type": "rental",
    "ami_max_percent": 80,
    "ami_min_percent": 50,
    "county_residency_required": false,
    "county_employment_required": true,
    "first_time_buyer_required": false,
    "bedrooms": 2,
    "monthly_rent": 1100,
    "purchase_price": null,
    "status": "available",
    "contact_info": "housing@example.com",
    "notes": "Pets allowed with deposit"
  }
]
```

An empty array `[]` means no listings matched — this is a valid 200 response, not an error.

**Error responses:**

| Status | Cause |
|--------|-------|
| 400 | Missing or invalid field in request body |
| 500 | Failed to fetch or parse Google Sheets data |

### GET /api/listings

Debug endpoint. Returns the raw parsed sheet data before any matching is applied.

```json
{
  "listings": [...],
  "amiTable": {
    "4": { "30": 28000, "50": 46000, "60": 55200, "80": 73600, "100": 92000, "120": 110400 }
  }
}
```

Useful for verifying that the CSV parser is reading the spreadsheet correctly. Not intended for production use.

---

## Frontend

**File:** [`src/app/page.tsx`](src/app/page.tsx)

The calculator is a single client-side form. Fields:

| Field | Always shown | Notes |
|-------|-------------|-------|
| Rent vs. Buy | Yes | Radio buttons; controls listing type and conditional fields |
| Annual Household Income | Yes | Dollar amount; validated > 0 |
| Household Size | Yes | Integer 1–8 |
| Live in Gunnison County? | Yes | Yes / No dropdown |
| Work in Gunnison County? | Yes | Yes / No dropdown |
| First-time buyer? | Ownership only | Shown/hidden based on listing type selection |

**Form states:** `idle` → `loading` → `done`. Results are rendered as [`ListingCard`](src/components/ListingCard.tsx) components. If the API returns an empty array, a soft "no match" message is shown with contact info for the Housing Authority — the user is never left without a path forward.

The form has no styling of its own. It relies on the host site's CSS, since the tool is designed to be embedded as an iframe.

---

## Setup

### Prerequisites

- Node.js 18+
- A Google Sheet published as CSV (two tabs: listings + AMI table)

### Install

```bash
npm install
```

### Environment variables

Copy `.env.local.example` to `.env.local` and fill in the two URLs:

```bash
cp .env.local.example .env.local
```

```env
LISTINGS_CSV_URL=https://docs.google.com/spreadsheets/d/e/<ID>/pub?gid=0&single=true&output=csv
AMI_TABLE_CSV_URL=https://docs.google.com/spreadsheets/d/e/<ID>/pub?gid=<GID>&single=true&output=csv
```

To get these URLs: In Google Sheets, go to **File → Share → Publish to web**, select the relevant sheet tab, choose **CSV**, and copy the link.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
npm start
```

---

## Embedding

The app sets `frame-ancestors *` in its Content-Security-Policy header, allowing it to be embedded in any website:

```html
<iframe
  src="https://your-deployment.vercel.app"
  width="100%"
  height="800"
  frameborder="0"
  title="Gunnison County Housing Calculator"
></iframe>
```

No CORS configuration is needed. The parent site's CSS does not bleed into the iframe, so the calculator renders with its own (minimal) styles.

---

## Testing

```bash
npm test
```

Test files:

| File | Covers |
|------|--------|
| [`src/lib/__tests__/ami-engine.test.ts`](src/lib/__tests__/ami-engine.test.ts) | AMI tier calculation, boundary cases, over-income sentinel |
| [`src/lib/__tests__/eligibility-matcher.test.ts`](src/lib/__tests__/eligibility-matcher.test.ts) | All six eligibility criteria, AND logic, empty results |
| [`src/lib/__tests__/csv-parsers.test.ts`](src/lib/__tests__/csv-parsers.test.ts) | Header detection, boolean/currency parsing, both AMI table orientations |
| [`src/lib/__tests__/env.test.ts`](src/lib/__tests__/env.test.ts) | Missing env var validation |
| [`src/app/api/match/__tests__/route.test.ts`](src/app/api/match/__tests__/route.test.ts) | API validation, caching TTL, mocked sheet data |
| [`src/app/__tests__/page.test.tsx`](src/app/__tests__/page.test.tsx) | Form rendering, client-side validation, submit flow, result/empty states |
| [`src/components/__tests__/ListingCard.test.tsx`](src/components/__tests__/ListingCard.test.tsx) | Card rendering for rental and ownership listings |
| [`src/__tests__/embed.test.ts`](src/__tests__/embed.test.ts) | Verifies embed-test.html has correct iframe attributes |

---

## Architecture Decisions

**Criterion array pattern:** Each eligibility rule is a single entry in `CRITERIA[]`. Adding a rule requires adding one array entry — no conditional branches scattered across a function. This keeps the matcher readable and each criterion independently testable.

**Pure functions for core logic:** `getAMIPercent` and `matchListings` take all inputs as parameters and return values with no side effects. This makes unit testing deterministic and eliminates the need to mock I/O in matching tests.

**Google Sheets as the database:** Housing coordinators can update listings without touching code or a CMS. The published CSV export requires no Google Cloud project, API keys, or OAuth — just a shareable link.

**No user data stored:** The calculator is intentionally stateless. Submitted form values are used only to compute results for that request and are never logged or persisted.

**Iframe embedding over JS widget:** An iframe provides hard CSS isolation (the host site cannot accidentally break the calculator's layout) and keeps the deployment self-contained. The `frame-ancestors *` CSP header is the only configuration needed on the host side.

**Server-side sheet fetching:** Google Sheets CSV URLs never reach the client browser. This avoids exposing the sheet IDs in client-side code and prevents users from directly querying the raw data outside the calculator's validation layer.
