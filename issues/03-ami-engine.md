# Issue 3: AMI Engine + unit tests

**Label:** `ready-for-agent`
**Type:** AFK
**Blocked by:** Issue 1

## What to build

Implement the AMI Engine as a pure function with a full unit test suite.

The function signature is:
```ts
getAMIPercent(householdSize: number, annualIncome: number, amiTable: AMITable): number
```

It returns the highest AMI tier percentage the household falls within. For example, if a household of 3 earns $62,000 and the Gunnison County 80% AMI limit for 3 people is $65,000, the function returns `80`. If income exceeds the 120% limit, return `120` (or a sentinel value indicating over-income — document the choice).

The `AMITable` type is a structure keyed by household size (1–8) and AMI tier percentage (30, 50, 60, 80, 100, 120), with income limit values in USD. This type is shared with the AMI Table Fetcher (Issue 2).

## Acceptance criteria

- [ ] `getAMIPercent` implemented as a pure function with no I/O or side effects
- [ ] `AMITable` type defined and exported for use by other modules
- [ ] Unit tests cover all AMI tiers (30/50/60/80/100/120%) for at least household sizes 1, 4, and 8
- [ ] Unit tests cover income exactly at a tier boundary (should return that tier)
- [ ] Unit tests cover income above the 120% limit
- [ ] Unit tests cover household size 1 (smallest) and household size 8 (largest)
- [ ] All tests pass

## Blocked by

Issue 1 (project scaffold — needs a place to live and a test runner configured)
