import { describe, it, expect } from "vitest";
import { matchListings } from "../eligibility-matcher";
import type { Listing, UserProfile } from "../eligibility-matcher";

// A fully-qualifying rental listing — used as a base to build failing cases from.
const BASE_LISTING: Listing = {
  listing_id: "001",
  listing_name: "123 Main St",
  type: "rental",
  ami_max_percent: 80,
  county_residency_required: false,
  county_employment_required: false,
  first_time_buyer_required: false,
  bedrooms: 2,
  monthly_rent: 1200,
  status: "available",
  contact_info: "housing@gunnisoncounty.org",
};

// A profile that qualifies for BASE_LISTING.
const BASE_PROFILE: UserProfile = {
  listingType: "rental",
  annualIncome: 60_000,
  householdSize: 3,
  countyResident: true,
  countyEmployee: false,
  firstTimeBuyer: false,
};

// amiPercent for BASE_PROFILE at $60,000 income (below 80% AMI limit)
const BASE_AMI_PERCENT = 60;

describe("matchListings", () => {
  it("returns all listings when profile qualifies for all of them", () => {
    const listings = [BASE_LISTING, { ...BASE_LISTING, listing_id: "002" }];
    expect(matchListings(BASE_PROFILE, listings, BASE_AMI_PERCENT)).toHaveLength(2);
  });

  it("excludes ownership listings from a renter's results", () => {
    const ownershipListing: Listing = { ...BASE_LISTING, type: "ownership" };
    expect(matchListings(BASE_PROFILE, [ownershipListing], BASE_AMI_PERCENT)).toHaveLength(0);
  });

  it("excludes a listing when the user's AMI percent exceeds the listing's maximum", () => {
    // Profile is at 80% AMI; listing only accepts up to 60% AMI
    const strictListing: Listing = { ...BASE_LISTING, ami_max_percent: 60 };
    expect(matchListings(BASE_PROFILE, [strictListing], 80)).toHaveLength(0);
  });

  it("excludes a listing when the user's AMI percent is below the listing's minimum", () => {
    // Profile is at 30% AMI; listing requires at least 50% AMI
    const minListing: Listing = { ...BASE_LISTING, ami_min_percent: 50 };
    expect(matchListings(BASE_PROFILE, [minListing], 30)).toHaveLength(0);
  });

  it("excludes a listing that requires county residency when the user is not a resident", () => {
    const residencyListing: Listing = { ...BASE_LISTING, county_residency_required: true };
    const nonResident: UserProfile = { ...BASE_PROFILE, countyResident: false };
    expect(matchListings(nonResident, [residencyListing], BASE_AMI_PERCENT)).toHaveLength(0);
  });

  it("excludes a listing that requires county employment when the user is not employed locally", () => {
    const employmentListing: Listing = { ...BASE_LISTING, county_employment_required: true };
    const nonEmployee: UserProfile = { ...BASE_PROFILE, countyEmployee: false };
    expect(matchListings(nonEmployee, [employmentListing], BASE_AMI_PERCENT)).toHaveLength(0);
  });

  it("returns an empty array when no listings match the profile", () => {
    const ownershipListing: Listing = { ...BASE_LISTING, type: "ownership" };
    // BASE_PROFILE is a renter — no rental listings provided
    expect(matchListings(BASE_PROFILE, [ownershipListing], BASE_AMI_PERCENT)).toEqual([]);
  });

  it("excludes a listing that fails multiple criteria at once", () => {
    const restrictiveListing: Listing = {
      ...BASE_LISTING,
      type: "ownership",          // wrong type for renter
      ami_max_percent: 30,        // too low AMI cap
      county_residency_required: true,
    };
    const nonResident: UserProfile = { ...BASE_PROFILE, countyResident: false };
    expect(matchListings(nonResident, [restrictiveListing], 80)).toHaveLength(0);
  });

  it("excludes an ownership listing requiring first-time buyer status when user is not a first-time buyer", () => {
    const ftbListing: Listing = {
      ...BASE_LISTING,
      type: "ownership",
      first_time_buyer_required: true,
      purchase_price: 350_000,
    };
    const nonFtbBuyer: UserProfile = {
      ...BASE_PROFILE,
      listingType: "ownership",
      firstTimeBuyer: false,
    };
    expect(matchListings(nonFtbBuyer, [ftbListing], BASE_AMI_PERCENT)).toHaveLength(0);
  });
});
