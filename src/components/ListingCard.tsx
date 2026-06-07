import type { Listing } from "@/lib/eligibility-matcher";

function CapBadge({ cap }: { cap: number }) {
  return (
    <span
      className="cap-badge"
      title={`Restricted to households up to ${cap}% AMI`}
    >
      ≤ {cap}% AMI
    </span>
  );
}

function specSep() {
  return <span className="spec-sep" />;
}

export function ListingCard({
  listing,
  index = 0,
}: {
  listing: Listing;
  index?: number;
}) {
  const isRental = listing.type === "rental";

  const priceLabel = isRental
    ? listing.monthly_rent !== undefined
      ? `$${listing.monthly_rent.toLocaleString()}/month`
      : null
    : listing.purchase_price !== undefined
    ? `$${listing.purchase_price.toLocaleString()}`
    : null;

  const bedLabel =
    listing.bedrooms === 0
      ? "Studio"
      : `${listing.bedrooms} bedroom${listing.bedrooms !== 1 ? "s" : ""}`;

  const tags: string[] = [];
  if (isRental) tags.push("Rental");
  else tags.push("For sale");
  if (listing.county_residency_required) tags.push("Residency required");
  if (listing.first_time_buyer_required) tags.push("First-time buyers");

  return (
    <article className="listing">
      <div className="listing-figure" aria-hidden="true">
        <span className="listing-index">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="listing-figure-label">
          {isRental ? "For rent" : "For sale"} · photo
        </span>
      </div>

      <div className="listing-body">
        <div className="listing-top">
          <div>
            <h3 className="listing-address">{listing.listing_name}</h3>
            {listing.ami_min_percent !== undefined ? (
              <div className="listing-sub">
                {listing.ami_min_percent}–{listing.ami_max_percent}% AMI range
              </div>
            ) : null}
          </div>
          {priceLabel && (
            <div className="listing-price">{priceLabel}</div>
          )}
        </div>

        <div className="listing-specs">
          <span>{bedLabel}</span>
          {specSep()}
          <span>{isRental ? "For rent" : "For sale"}</span>
        </div>

        {listing.notes && (
          <p className="listing-blurb">{listing.notes}</p>
        )}

        <div className="listing-tags">
          <CapBadge cap={listing.ami_max_percent} />
          {tags.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>

        <div className="listing-foot">
          <div className="listing-contact">
            <span className="contact-name">{listing.contact_info}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
