export type UserProfile = {
  listingType: "rental" | "ownership";
  annualIncome: number;
  householdSize: number;
  countyResident: boolean;
  countyEmployee: boolean;
  firstTimeBuyer?: boolean;
};

export type Listing = {
  listing_id: string;
  listing_name: string;
  type: "rental" | "ownership";
  ami_max_percent: number;
  ami_min_percent?: number;
  household_size_min?: number;
  household_size_max?: number;
  county_residency_required: boolean;
  county_employment_required: boolean;
  first_time_buyer_required: boolean;
  bedrooms: number;
  monthly_rent?: number;
  purchase_price?: number;
  status: "available" | "pending" | "unavailable";
  contact_info: string;
  notes?: string;
};

type Criterion = {
  passes: (profile: UserProfile, listing: Listing, amiPercent: number) => boolean;
};

const CRITERIA: Criterion[] = [
  { passes: (p, l) => l.type === p.listingType },
  { passes: (_p, l, ami) => ami <= l.ami_max_percent },
  { passes: (_p, l, ami) => l.ami_min_percent === undefined || ami >= l.ami_min_percent },
  { passes: (p, l) => !l.county_residency_required || p.countyResident },
  { passes: (p, l) => !l.county_employment_required || p.countyEmployee },
  { passes: (p, l) => !l.first_time_buyer_required || p.firstTimeBuyer === true },
];

export function matchListings(
  profile: UserProfile,
  listings: Listing[],
  amiPercent: number
): Listing[] {
  return listings.filter((listing) =>
    CRITERIA.every((criterion) => criterion.passes(profile, listing, amiPercent))
  );
}
