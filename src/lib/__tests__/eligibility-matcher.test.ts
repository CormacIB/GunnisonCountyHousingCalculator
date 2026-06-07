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
  first_time_buyer_required: false,
  no_county_property_required: false,
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
  firstTimeBuyer: false,
  countyIncomePercent: 0,
  ownsPropertyInCounty: false,
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

  it("excludes a listing requiring 60% county income when user earns less", () => {
    const incomeListing: Listing = { ...BASE_LISTING, county_income_min_percent: 60 };
    const lowCountyIncome: UserProfile = { ...BASE_PROFILE, countyIncomePercent: 0 };
    expect(matchListings(lowCountyIncome, [incomeListing], BASE_AMI_PERCENT)).toHaveLength(0);
  });

  it("includes a listing requiring 60% county income when user earns 80%", () => {
    const incomeListing: Listing = { ...BASE_LISTING, county_income_min_percent: 60 };
    const highCountyIncome: UserProfile = { ...BASE_PROFILE, countyIncomePercent: 80 };
    expect(matchListings(highCountyIncome, [incomeListing], BASE_AMI_PERCENT)).toHaveLength(1);
  });

  it("excludes a listing requiring 80% county income when user earns 60%", () => {
    const incomeListing: Listing = { ...BASE_LISTING, county_income_min_percent: 80 };
    const midCountyIncome: UserProfile = { ...BASE_PROFILE, countyIncomePercent: 60 };
    expect(matchListings(midCountyIncome, [incomeListing], BASE_AMI_PERCENT)).toHaveLength(0);
  });

  it("excludes a listing requiring no existing county property when user owns property", () => {
    const noPropertyListing: Listing = { ...BASE_LISTING, no_county_property_required: true };
    const ownerProfile: UserProfile = { ...BASE_PROFILE, ownsPropertyInCounty: true };
    expect(matchListings(ownerProfile, [noPropertyListing], BASE_AMI_PERCENT)).toHaveLength(0);
  });

  it("includes a listing requiring no existing county property when user does not own property", () => {
    const noPropertyListing: Listing = { ...BASE_LISTING, no_county_property_required: true };
    expect(matchListings(BASE_PROFILE, [noPropertyListing], BASE_AMI_PERCENT)).toHaveLength(1);
  });
});
