import type { Listing } from "@/lib/eligibility-matcher";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <article>
      <h2>{listing.listing_name}</h2>
      <span>{listing.type === "rental" ? "Rental" : "For Sale"}</span>
      <p>
        {listing.bedrooms} bedroom{listing.bedrooms !== 1 ? "s" : ""}
      </p>
      {listing.monthly_rent !== undefined && (
        <p>${listing.monthly_rent.toLocaleString()}/month</p>
      )}
      {listing.purchase_price !== undefined && (
        <p>${listing.purchase_price.toLocaleString()}</p>
      )}
      <p>Up to {listing.ami_max_percent}% AMI</p>
      {listing.county_residency_required && (
        <p>Gunnison County residency required</p>
      )}
      {listing.county_employment_required && (
        <p>Gunnison County employment required</p>
      )}
      <p>Contact: {listing.contact_info}</p>
      {listing.notes && <p>{listing.notes}</p>}
    </article>
  );
}
