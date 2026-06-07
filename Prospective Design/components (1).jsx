// ─────────────────────────────────────────────────────────────────────────
// Gunnison Valley Housing — UI components
// ─────────────────────────────────────────────────────────────────────────
const { useState, useRef, useEffect } = React;

// ── Small building blocks ────────────────────────────────────────────────

function Eyebrow({ children }) {
  return <div className="eyebrow">{children}</div>;
}

function Field({ label, hint, children, htmlFor }) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        <span>{label}</span>
        {hint ? <span className="field-hint">{hint}</span> : null}
      </label>
      {children}
    </div>
  );
}

// Two- or three-option segmented control with a sliding underline indicator
function Segmented({ options, value, onChange, name }) {
  return (
    <div className="seg" role="radiogroup" aria-label={name}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            type="button"
            key={o.value}
            role="radio"
            aria-checked={active}
            className={"seg-btn" + (active ? " is-active" : "")}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Currency input that keeps a clean grouped display while typing
function MoneyInput({ value, onChange, id }) {
  const display = value ? Number(value).toLocaleString("en-US") : "";
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

// Stepper for household size
function Stepper({ value, onChange, min = 1, max = 8 }) {
  const set = (n) => onChange(Math.max(min, Math.min(max, n)));
  return (
    <div className="stepper">
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

// ── Form panel ───────────────────────────────────────────────────────────

function FormPanel({ inputs, set, onSubmit }) {
  const yn = [
    { value: true, label: "Yes" },
    { value: false, label: "No" },
  ];
  return (
    <form
      className="panel form-panel"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="panel-head">
        <Eyebrow>Step 01 — About your household</Eyebrow>
        <h2 className="panel-title">Tell us a little about you</h2>
      </div>

      <Field label="Looking to" hint="rent or buy">
        <Segmented
          name="Rent or buy"
          value={inputs.mode}
          onChange={(v) => set({ mode: v })}
          options={[
            { value: "rent", label: "Rent" },
            { value: "buy", label: "Buy" },
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
          value={inputs.income}
          onChange={(v) => set({ income: v })}
        />
      </Field>

      <Field label="Household size" hint="people living with you">
        <Stepper
          value={inputs.size}
          onChange={(v) => set({ size: v })}
        />
      </Field>

      <div className="field-row">
        <Field label="Live in Gunnison County?">
          <Segmented
            name="Live in county"
            value={inputs.livesInCounty}
            onChange={(v) => set({ livesInCounty: v })}
            options={yn}
          />
        </Field>
        <Field label="Work in Gunnison County?">
          <Segmented
            name="Work in county"
            value={inputs.worksInCounty}
            onChange={(v) => set({ worksInCounty: v })}
            options={yn}
          />
        </Field>
      </div>

      {inputs.mode === "buy" ? (
        <Field label="First-time buyer?" hint="no home in the last 3 years">
          <Segmented
            name="First-time buyer"
            value={inputs.firstTimeBuyer}
            onChange={(v) => set({ firstTimeBuyer: v })}
            options={yn}
          />
        </Field>
      ) : null}

      <button type="submit" className="btn-primary">
        Find homes for me
        <span className="btn-arrow" aria-hidden="true">→</span>
      </button>
      <p className="form-foot">
        Estimates use illustrative {new Date().getFullYear()} Area Median Income
        figures for the Gunnison Valley.
      </p>
    </form>
  );
}

// ── AMI meter ────────────────────────────────────────────────────────────

function AmiMeter({ pct }) {
  const MAX = 160;
  const clamped = Math.min(pct, MAX);
  const left = (clamped / MAX) * 100;
  const over = pct > MAX;
  return (
    <div className="meter">
      <div className="meter-track">
        <div className="meter-fill" style={{ width: left + "%" }} />
        {window.HC.AMI_TICKS.map((t) => (
          <div
            key={t}
            className="meter-tick"
            style={{ left: (t / MAX) * 100 + "%" }}
          >
            <span className="meter-tick-label">{t}</span>
          </div>
        ))}
        <div
          className="meter-marker"
          style={{ left: left + "%" }}
          aria-hidden="true"
        >
          <span className="meter-marker-flag">{over ? "160%+" : pct + "%"}</span>
        </div>
      </div>
      <div className="meter-axis">
        <span>% of Area Median Income</span>
        <span className="meter-axis-end">160%+</span>
      </div>
    </div>
  );
}

// ── Eligibility summary ──────────────────────────────────────────────────

function Eligibility({ inputs, result }) {
  const { pct, local } = result;
  const tier = window.HC.qualifyingTier(pct);
  const ami100 = window.HC.ami100ForSize(inputs.size);

  if (!inputs.income) {
    return (
      <div className="panel summary summary-empty">
        <Eyebrow>Your eligibility</Eyebrow>
        <p className="summary-prompt">
          Enter your household income to see where you fall on the Area Median
          Income scale and which homes you may qualify for.
        </p>
      </div>
    );
  }

  return (
    <div className="panel summary">
      <div className="summary-grid">
        <div>
          <Eyebrow>Your eligibility</Eyebrow>
          <div className="summary-big">
            <span className="summary-pct">{pct}%</span>
            <span className="summary-of">of Area Median Income</span>
          </div>
          <div className="summary-sub">
            Household of {inputs.size} · {window.HC.fmtMoney(inputs.income)}/yr
            <span className="summary-dot">·</span>
            {window.HC.fmtMoney(ami100)} = 100% AMI at this size
          </div>
        </div>
        <div className="summary-pill-wrap">
          <div className="summary-pill">
            <span className="summary-pill-k">May qualify up to</span>
            <span className="summary-pill-v">{tier}% AMI</span>
          </div>
        </div>
      </div>

      <AmiMeter pct={pct} />

      <div className={"summary-note" + (local ? " is-good" : " is-warn")}>
        <span className="note-dot" aria-hidden="true" />
        {local
          ? "You count as a local household — that opens up homes reserved for people who live or work in the county."
          : "Heads up: some homes are reserved for people who live or work in Gunnison County. Those are hidden below."}
      </div>
    </div>
  );
}

// ── Listing card ─────────────────────────────────────────────────────────

function CapBadge({ cap }) {
  return (
    <span className="cap-badge" title={"Restricted to households up to " + cap + "% AMI"}>
      ≤ {cap}% AMI
    </span>
  );
}

function ListingCard({ l, index }) {
  const priceLabel =
    l.mode === "rent"
      ? window.HC.fmtMoney(l.price) + " /mo"
      : window.HC.fmtMoney(l.price);
  const bedLabel = l.beds === 0 ? "Studio" : l.beds + " bd";
  return (
    <article className="listing">
      <div className="listing-figure" aria-hidden="true">
        <span className="listing-figure-label">
          {l.town} · photo
        </span>
        <span className="listing-index">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="listing-body">
        <div className="listing-top">
          <div>
            <h3 className="listing-address">{l.address}</h3>
            <div className="listing-town">{l.town}, CO</div>
          </div>
          <div className="listing-price">
            {priceLabel}
          </div>
        </div>

        <div className="listing-specs">
          <span>{bedLabel}</span>
          <span className="spec-sep" />
          <span>{l.baths} ba</span>
          <span className="spec-sep" />
          <span>{l.sqft.toLocaleString()} sqft</span>
          <span className="spec-sep" />
          <span>{l.mode === "rent" ? "For rent" : "For sale"}</span>
        </div>

        <p className="listing-blurb">{l.blurb}</p>

        <div className="listing-tags">
          <CapBadge cap={l.amiCap} />
          {l.tags.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>

        <div className="listing-foot">
          <div className="listing-contact">
            <span className="contact-name">{l.contact}</span>
            <span className="contact-phone">{l.phone}</span>
          </div>
          <button type="button" className="btn-ghost">
            Request info
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Results ──────────────────────────────────────────────────────────────

function Results({ inputs, result, hasSearched }) {
  const { eligible, hidden } = result;
  const totalHidden = hidden.income + hidden.residency + hidden.firsttime;

  if (!inputs.income && !hasSearched) {
    return null;
  }

  return (
    <section className="results">
      <div className="results-head">
        <Eyebrow>Step 02 — Homes for you</Eyebrow>
        <h2 className="results-title">
          {eligible.length > 0
            ? `${eligible.length} ${inputs.mode === "rent" ? "rental" : "for-sale"} ${
                eligible.length === 1 ? "home" : "homes"
              } you may qualify for`
            : "No matches just yet"}
        </h2>
      </div>

      {eligible.length > 0 ? (
        <div className="listing-list">
          {eligible.map((l, i) => (
            <ListingCard key={l.id} l={l} index={i} />
          ))}
        </div>
      ) : (
        <div className="panel empty-state">
          <p className="empty-lead">
            We couldn't find a {inputs.mode === "rent" ? "rental" : "home for sale"}{" "}
            matching this household right now.
          </p>
          <p className="empty-sub">
            Availability changes often. Add your name to the interest list and the
            Housing Authority will reach out as new homes open up.
          </p>
          <button type="button" className="btn-primary btn-compact">
            Join the interest list
          </button>
        </div>
      )}

      {totalHidden > 0 ? (
        <div className="hidden-note">
          <span className="hidden-count">{totalHidden}</span>
          <span>
            other {inputs.mode === "rent" ? "rentals" : "homes"} are hidden
            {hidden.income > 0
              ? ` — ${hidden.income} priced for lower income limits`
              : ""}
            {hidden.residency > 0
              ? `${hidden.income > 0 ? "," : " —"} ${hidden.residency} require living or working in the county`
              : ""}
            {hidden.firsttime > 0
              ? `${hidden.income > 0 || hidden.residency > 0 ? "," : " —"} ${hidden.firsttime} for first-time buyers`
              : ""}
            .
          </span>
        </div>
      ) : null}
    </section>
  );
}

Object.assign(window, {
  FormPanel,
  Eligibility,
  Results,
  AmiMeter,
  ListingCard,
});
