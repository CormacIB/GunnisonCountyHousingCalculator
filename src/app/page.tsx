"use client";

import { useState, FormEvent } from "react";
import type { Listing } from "@/lib/eligibility-matcher";
import { ListingCard } from "@/components/ListingCard";

type Status = "idle" | "loading" | "done";

export default function Home() {
  const [listingType, setListingType] = useState<"rental" | "ownership">("rental");
  const [annualIncome, setAnnualIncome] = useState("");
  const [householdSize, setHouseholdSize] = useState("");
  const [countyResident, setCountyResident] = useState("yes");
  const [countyEmployee, setCountyEmployee] = useState("yes");
  const [firstTimeBuyer, setFirstTimeBuyer] = useState("yes");

  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<Listing[] | null>(null);

  function validate(): string | null {
    const income = Number(annualIncome);
    if (!annualIncome || isNaN(income) || income <= 0) {
      return "Annual income must be a positive number.";
    }
    const size = Number(householdSize);
    if (!householdSize || isNaN(size) || size < 1 || size > 8) {
      return "Household size must be between 1 and 8.";
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const error = validate();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    setApiError(null);
    setStatus("loading");

    const profile = {
      listingType,
      annualIncome: Number(annualIncome),
      householdSize: Number(householdSize),
      countyResident: countyResident === "yes",
      countyEmployee: countyEmployee === "yes",
      ...(listingType === "ownership" && { firstTimeBuyer: firstTimeBuyer === "yes" }),
    };

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error (${res.status})`);
      }
      const data: Listing[] = await res.json();
      setResults(data);
      setStatus("done");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "1rem" }}>
      <h1>Find Affordable Housing in Gunnison County</h1>

      <form onSubmit={handleSubmit} noValidate>
        {validationError && (
          <p role="alert" style={{ color: "red" }}>
            {validationError}
          </p>
        )}
        {apiError && (
          <p role="alert" style={{ color: "red" }}>
            {apiError}
          </p>
        )}

        <div>
          <label>
            <input
              type="radio"
              name="listingType"
              value="rental"
              checked={listingType === "rental"}
              onChange={() => setListingType("rental")}
            />{" "}
            Rent
          </label>
          <label>
            <input
              type="radio"
              name="listingType"
              value="ownership"
              checked={listingType === "ownership"}
              onChange={() => setListingType("ownership")}
            />{" "}
            Buy
          </label>
        </div>

        <div>
          <label>
            Annual Household Income
            <input
              type="number"
              name="annualIncome"
              min="0"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            Household Size
            <input
              type="number"
              name="householdSize"
              min="1"
              max="8"
              value={householdSize}
              onChange={(e) => setHouseholdSize(e.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            Currently live in Gunnison County?
            <select
              name="countyResident"
              value={countyResident}
              onChange={(e) => setCountyResident(e.target.value)}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            Currently work in Gunnison County?
            <select
              name="countyEmployee"
              value={countyEmployee}
              onChange={(e) => setCountyEmployee(e.target.value)}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>

        {listingType === "ownership" && (
          <div>
            <label>
              First-time buyer?
              <select
                name="firstTimeBuyer"
                value={firstTimeBuyer}
                onChange={(e) => setFirstTimeBuyer(e.target.value)}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>
        )}

        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Searching…" : "Find property for me!"}
        </button>
      </form>

      {status === "loading" && (
        <p aria-live="polite">Loading results…</p>
      )}

      {status === "done" && results !== null && (
        results.length === 0 ? (
          <section aria-label="no results">
            <p>No listings match your profile right now.</p>
            <p>
              Contact the Gunnison County Housing Authority for help, or check
              back as new listings are added regularly.
            </p>
          </section>
        ) : (
          <ul>
            {results.map((listing) => (
              <li key={listing.listing_id}>
                <ListingCard listing={listing} />
              </li>
            ))}
          </ul>
        )
      )}
    </main>
  );
}

