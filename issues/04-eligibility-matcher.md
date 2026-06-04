# Issue 4: Eligibility Matcher + Criteria Config + unit tests

**Label:** `ready-for-agent`
**Type:** AFK
**Blocked by:** Issue 3

## What to build

Implement the Eligibility Matcher and its supporting Criteria Config as pure functions/data with a full unit test suite.

The function signature is:
```ts
matchListings(profile: UserProfile, listings: Listing[], amiPercent: number): Listing[]
```

`UserProfile` shape:
```ts
{
  listingType: 'rental' | 'ownership',
  annualIncome: number,
  householdSize: number,
  countyResident: boolean,
  countyEmployee: boolean,
  firstTimeBuyer?: boolean  // only relevant when listingType === 'ownership'
}
```

The Criteria Config is a typed array where each entry declares: the listing field to check, the profile field to compare against, and the comparison operator. The matcher iterates this config and filters out any listing that fails any criterion. Adding a new eligibility rule requires only a new entry in the config array — no changes to the matcher function itself.

Criteria to implement for v1: listing type match, AMI max/min, household size min/max, county residency requirement, county employment requirement, first-time buyer requirement.

## Acceptance criteria

- [ ] `matchListings` implemented as a pure function with no I/O or side effects
- [ ] `UserProfile` and `Listing` types defined and exported
- [ ] Criteria Config implemented as a typed, extensible array — adding a new criterion requires no changes to `matchListings`
- [ ] Unit tests cover each criterion individually (a listing that fails only that one criterion is excluded)
- [ ] Unit tests cover a profile that matches zero listings
- [ ] Unit tests cover a profile that matches all listings
- [ ] Unit tests cover multiple criteria failing simultaneously
- [ ] Unit tests cover the first-time buyer criterion (ownership listings only)
- [ ] All tests pass

## Blocked by

Issue 3 (AMI Engine — provides the `amiPercent` input and shared `AMITable` type)
