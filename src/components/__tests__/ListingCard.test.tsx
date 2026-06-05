// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { ListingCard } from "../ListingCard";
import type { Listing } from "@/lib/eligibility-matcher";

const BASE_LISTING: Listing = {
  listing_id: "001",
  listing_name: "42 Elk Ave, Gunnison",
  type: "rental",
  ami_max_percent: 80,
  bedrooms: 2,
  monthly_rent: 1100,
  county_residency_required: false,
  county_employment_required: false,
  first_time_buyer_required: false,
  status: "available",
  contact_info: "housing@gunnisoncounty.org",
};

describe("ListingCard", () => {
  it("renders listing name, type badge, bedrooms, rent, AMI tier, and contact", () => {
    render(<ListingCard listing={BASE_LISTING} />);

    expect(screen.getByText("42 Elk Ave, Gunnison")).toBeInTheDocument();
    expect(screen.getByText(/rental/i)).toBeInTheDocument();
    expect(screen.getByText(/2 bedrooms/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1,100\/month/i)).toBeInTheDocument();
    expect(screen.getByText(/80%.*ami/i)).toBeInTheDocument();
    expect(screen.getByText(/housing@gunnisoncounty\.org/)).toBeInTheDocument();
  });

  it("shows purchase price for ownership listings instead of monthly rent", () => {
    const ownershipListing: Listing = {
      ...BASE_LISTING,
      type: "ownership",
      monthly_rent: undefined,
      purchase_price: 320_000,
    };
    render(<ListingCard listing={ownershipListing} />);

    expect(screen.getAllByText(/for sale/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/\$320,000/)).toBeInTheDocument();
    expect(screen.queryByText(/\/month/i)).not.toBeInTheDocument();
  });

  it("shows residency and employment flags when required", () => {
    const flaggedListing: Listing = {
      ...BASE_LISTING,
      county_residency_required: true,
      county_employment_required: true,
    };
    render(<ListingCard listing={flaggedListing} />);

    expect(screen.getByText(/residency required/i)).toBeInTheDocument();
    expect(screen.getByText(/employment required/i)).toBeInTheDocument();
  });

  it("shows notes when present", () => {
    render(<ListingCard listing={{ ...BASE_LISTING, notes: "Pets allowed." }} />);
    expect(screen.getByText("Pets allowed.")).toBeInTheDocument();
  });

  it("does not render a notes element when notes are absent", () => {
    render(<ListingCard listing={BASE_LISTING} />);
    expect(screen.queryByText(/pets/i)).not.toBeInTheDocument();
  });
});
