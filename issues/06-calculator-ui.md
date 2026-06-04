# Issue 6: Calculator Form + Results View + Listing Card

**Label:** `ready-for-agent`
**Type:** AFK
**Blocked by:** Issue 5

## What to build

Implement the complete user-facing UI: the input form, the results card list, and the soft-landing empty state. This is the only page of the application.

**Calculator Form**
- Rent vs. buy toggle (shown first)
- Annual household income (number input)
- Household size (number input, 1–8)
- Currently live in Gunnison County? (yes/no)
- Currently work in Gunnison County? (yes/no)
- First-time buyer? (yes/no — shown only when "buy" is selected)
- "Find property for me!" submit button
- Client-side validation: all fields required, income must be a positive number, household size must be 1–8

**Results View**
- On submit, POST `UserProfile` to `/api/match` and display results
- If matches exist: render a card list (one `ListingCard` per result)
- If no matches: render a soft-landing empty state — a friendly message explaining no listings match right now, with actionable next steps (e.g. "Contact the Gunnison County Housing Authority at [contact info]" and "Check back as new listings are added regularly")
- Loading state shown while the request is in flight

**Listing Card**
- Displays: listing name/address, type badge (Rental / For Sale), bedrooms, monthly rent or purchase price, AMI tier requirement, county residency/employment flags if required, contact info or link, notes (if any)
- Clean, neutral design — no strong branding, readable on mobile

**Layout**
- Single-page layout, mobile-responsive
- No navigation, no header/footer beyond the tool itself — this will live inside an iframe

## Acceptance criteria

- [ ] Form renders all fields; first-time buyer field appears only when "buy" is selected
- [ ] Client-side validation prevents submission with missing or invalid fields
- [ ] Submitting the form calls `POST /api/match` with the correct `UserProfile` body
- [ ] Matched listings are displayed as cards with all required fields visible
- [ ] Empty state renders with a helpful message and next steps when no matches are returned
- [ ] Loading state is shown while the API request is in flight
- [ ] Layout is usable on a 375px wide mobile screen (no horizontal scrolling, readable text)
- [ ] Design is neutral and generic — no org-specific branding

## Blocked by

Issue 5 (`/api/match` route — the form needs a working endpoint to POST to)
