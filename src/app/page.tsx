"use client";

import { useState } from "react";
import type { Listing } from "@/lib/eligibility-matcher";
import { ListingCard } from "@/components/ListingCard";

// Illustrative 100% AMI figures by household size — used for display only.
// Actual eligibility uses live HUD data from the spreadsheet.
const AMI_100: Record<number, number> = {
  1: 68000, 2: 77700, 3: 87400, 4: 97100,
  5: 104900, 6: 112700, 7: 120400, 8: 128200,
};
const AMI_TICKS = [30, 60, 80, 100, 120];
const METER_MAX = 140;

function fmtMoney(n: number) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

// ── Small components ────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}

function Field({
  label, hint, htmlFor, children,
}: {
  label: string; hint?: string; htmlFor?: string; children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        <span>{label}</span>
        {hint && <span className="field-hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Segmented<T extends string | boolean>({
  options, value, onChange, name,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  name: string;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          type="button"
          key={String(o.value)}
          role="radio"
          aria-checked={o.value === value}
          className={"seg-btn" + (o.value === value ? " is-active" : "")}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MoneyInput({
  value, onChange, id,
}: {
  value: number; onChange: (v: number) => void; id: string;
}) {
  const display = value ? value.toLocaleString("en-US") : "";
  return (
    <div className="money-wrap">
      <span className="money-prefix">$</span>
      <input
        id={id}
        className="input input-money"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        value={display}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 7);
          onChange(digits ? Number(digits) : 0);
        }}
      />
      <span className="money-suffix">/ yr</span>
    </div>
  );
}

function Stepper({
  value, onChange, min = 1, max = 8,
}: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  const set = (n: number) => onChange(Math.max(min, Math.min(max, n)));
  return (
    <div className="stepper" role="group" aria-label="Household size">
      <button
        type="button"
        className="step-btn"
        aria-label="Decrease"
        onClick={() => set(value - 1)}
        disabled={value <= min}
      >
        –
      </button>
      <div className="step-value">
        {value}
        <span className="step-unit">{value === 1 ? "person" : "people"}</span>
      </div>
      <button
        type="button"
        className="step-btn"
        aria-label="Increase"
        onClick={() => set(value + 1)}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}

function AmiMeter({ displayPct }: { displayPct: number }) {
  const clamped = Math.min(displayPct, METER_MAX);
  const left = (clamped / METER_MAX) * 100;
  const over = displayPct > METER_MAX;
  return (
    <div className="meter">
      <div className="meter-track">
        <div className="meter-fill" style={{ width: left + "%" }} />
        {AMI_TICKS.map((t) => (
          <div
            key={t}
            className="meter-tick"
            style={{ left: (t / METER_MAX) * 100 + "%" }}
          >
            <span className="meter-tick-label">{t}</span>
          </div>
        ))}
        <div className="meter-marker" style={{ left: left + "%" }}>
          <span className="meter-marker-flag">
            {over ? `${METER_MAX}%+` : `${displayPct}%`}
          </span>
        </div>
      </div>
      <div className="meter-axis">
        <span>% of Area Median Income</span>
        <span className="meter-axis-end">{METER_MAX}%+</span>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────

type Status = "idle" | "loading" | "done";

const YN = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
] as const;

export default function Home() {
  const [mode, setMode] = useState<"rent" | "buy">("rent");
  const [annualIncome, setAnnualIncome] = useState(0);
  const [householdSize, setHouseholdSize] = useState(3);
  const [countyResident, setCountyResident] = useState(true);
  const [countyEmployee, setCountyEmployee] = useState(false);
  const [firstTimeBuyer, setFirstTimeBuyer] = useState(false);

  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<Listing[] | null>(null);
  const [amiTier, setAmiTier] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const local = countyResident || countyEmployee;
  const ami100 = AMI_100[Math.max(1, Math.min(8, householdSize))] ?? AMI_100[4];
  const displayPct = annualIncome > 0
    ? Math.round((annualIncome / ami100) * 100)
    : 0;

  function validate(): string | null {
    if (!annualIncome || annualIncome <= 0) {
      return "Annual income must be greater than zero.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
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
      listingType: mode === "rent" ? "rental" : "ownership",
      annualIncome,
      householdSize,
      countyResident,
      countyEmployee,
      ...(mode === "buy" && { firstTimeBuyer }),
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
      const { listings, amiPercent } = await res.json();
      setResults(listings);
      setAmiTier(amiPercent);
      setStatus("done");
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setStatus("idle");
    }
  }

  return (
    <div className="app">
      {/* ── Masthead ── */}
      <header className="masthead">
        <div className="mast-left">
          <div className="mast-mark" aria-hidden="true">
            <span className="mast-peak" />
          </div>
          <div className="mast-id">
            <div className="mast-org">Gunnison Valley Regional Housing Authority</div>
            <div className="mast-sub">Affordable homes finder</div>
          </div>
        </div>
        <div className="mast-right">Gunnison County, Colorado</div>
      </header>

      {/* ── Hero ── */}
      <div className="hero">
        <h1 className="hero-title">
          Find a home in the valley you can actually afford.
        </h1>
        <p className="hero-lede">
          Answer a few quick questions. We'll show where your household falls on
          the Area Median Income scale and the deed-restricted homes you may
          qualify for — to rent or to buy.
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="layout">
        {/* Form column */}
        <aside className="col-form">
          <form className="panel form-panel" onSubmit={handleSubmit} noValidate>
            <div className="panel-head">
              <Eyebrow>Step 01 — About your household</Eyebrow>
              <h2 className="panel-title">Tell us a little about you</h2>
            </div>

            {validationError && (
              <p role="alert" className="alert-error">{validationError}</p>
            )}
            {apiError && (
              <p role="alert" className="alert-error">{apiError}</p>
            )}

            <Field label="Looking to" hint="rent or buy">
              <Segmented
                name="Rent or buy"
                value={mode}
                onChange={setMode}
                options={[
                  { value: "rent" as const, label: "Rent" },
                  { value: "buy" as const, label: "Buy" },
                ]}
              />
            </Field>

            <Field
              label="Annual household income"
              hint="before taxes"
              htmlFor="income"
            >
              <MoneyInput
                id="income"
                value={annualIncome}
                onChange={setAnnualIncome}
              />
            </Field>

            <Field label="Household size" hint="people living with you">
              <Stepper value={householdSize} onChange={setHouseholdSize} />
            </Field>

            <div className="field-row">
              <Field label="Live in Gunnison County?">
                <Segmented
                  name="Live in Gunnison County?"
                  value={countyResident}
                  onChange={setCountyResident}
                  options={YN as unknown as { value: boolean; label: string }[]}
                />
              </Field>
              <Field label="Work in Gunnison County?">
                <Segmented
                  name="Work in Gunnison County?"
                  value={countyEmployee}
                  onChange={setCountyEmployee}
                  options={YN as unknown as { value: boolean; label: string }[]}
                />
              </Field>
            </div>

            {mode === "buy" && (
              <Field label="First-time buyer?" hint="no home in the last 3 years">
                <Segmented
                  name="First-time buyer?"
                  value={firstTimeBuyer}
                  onChange={setFirstTimeBuyer}
                  options={YN as unknown as { value: boolean; label: string }[]}
                />
              </Field>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Searching…" : "Find homes for me"}
              {status !== "loading" && (
                <span className="btn-arrow" aria-hidden="true">→</span>
              )}
            </button>
            <p className="form-foot">
              Estimates use {new Date().getFullYear()} Area Median Income
              figures for the Gunnison Valley.
            </p>
          </form>
        </aside>

        {/* Results column */}
        <main className="col-results">
          {/* Eligibility panel */}
          {status === "done" && amiTier !== null ? (
            <div className="panel summary">
              <div className="summary-grid">
                <div>
                  <Eyebrow>Your eligibility</Eyebrow>
                  <div className="summary-big">
                    <span className="summary-pct">{displayPct}%</span>
                    <span className="summary-of">of Area Median Income</span>
                  </div>
                  <div className="summary-sub">
                    Household of {householdSize} · {fmtMoney(annualIncome)}/yr
                    <span className="summary-dot">·</span>
                    {fmtMoney(ami100)} = 100% AMI at this size
                  </div>
                </div>
                <div className="summary-pill-wrap">
                  <div className="summary-pill">
                    <span className="summary-pill-k">May qualify up to</span>
                    <span className="summary-pill-v">
                      {amiTier >= 121 ? "Over income" : `${amiTier}% AMI`}
                    </span>
                  </div>
                </div>
              </div>
              <AmiMeter displayPct={displayPct} />
              <div className={"summary-note" + (local ? " is-good" : " is-warn")}>
                <span className="note-dot" aria-hidden="true" />
                {local
                  ? "You count as a local household — that opens up homes reserved for people who live or work in the county."
                  : "Heads up: some homes are reserved for people who live or work in Gunnison County. Those are hidden from your results."}
              </div>
            </div>
          ) : status === "loading" ? (
            <div className="panel summary summary-empty">
              <Eyebrow>Your eligibility</Eyebrow>
              <p className="summary-prompt" aria-live="polite">Loading results…</p>
            </div>
          ) : (
            <div className="panel summary summary-empty">
              <Eyebrow>Your eligibility</Eyebrow>
              <p className="summary-prompt">
                Enter your household income to see where you fall on the Area
                Median Income scale and which homes you may qualify for.
              </p>
            </div>
          )}

          {/* Results */}
          {status === "done" && results !== null && (
            <section className="results">
              <div className="results-head">
                <Eyebrow>Step 02 — Homes for you</Eyebrow>
                <h2 className="results-title">
                  {results.length > 0
                    ? `${results.length} ${mode === "rent" ? "rental" : "for-sale"} ${
                        results.length === 1 ? "home" : "homes"
                      } you may qualify for`
                    : "No matches just yet"}
                </h2>
              </div>

              {results.length > 0 ? (
                <div className="listing-list">
                  {results.map((listing, i) => (
                    <ListingCard
                      key={listing.listing_id}
                      listing={listing}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <div className="panel empty-state" aria-label="no results">
                  <p className="empty-lead">
                    No listings match your profile right now.
                  </p>
                  <p className="empty-sub">
                    Availability changes often. Contact the Gunnison County
                    Housing Authority for help, or check back as new listings
                    are added regularly.
                  </p>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="colophon">
        <span>
          Figures are illustrative and for demonstration only. Confirm current
          income limits and availability with the Housing Authority.
        </span>
        <span className="colophon-mark">GVRHA</span>
      </footer>
    </div>
  );
}
