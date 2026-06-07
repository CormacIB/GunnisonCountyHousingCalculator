// ─────────────────────────────────────────────────────────────────────────
// Gunnison Valley Housing — App
// ─────────────────────────────────────────────────────────────────────────
const { useState, useMemo, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#189090",
  "headlineFont": "Montserrat",
  "paper": "#f4f7f6",
  "showFigure": true
}/*EDITMODE-END*/;

const HEADLINE_FONTS = {
  "Montserrat": '"Montserrat",system-ui,sans-serif',
  "Poppins": '"Poppins",system-ui,sans-serif',
  "Open Sans": '"Open Sans",system-ui,sans-serif',
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const r = document.documentElement;
    const deep = window.HC.shade(t.accent, -0.16);
    r.style.setProperty("--accent", t.accent);
    r.style.setProperty("--accent-deep", deep);
    r.style.setProperty("--paper", t.paper);
    r.style.setProperty("--serif", HEADLINE_FONTS[t.headlineFont] || HEADLINE_FONTS.Montserrat);
    document.body.classList.toggle("no-figure", !t.showFigure);
  }, [t.accent, t.paper, t.headlineFont, t.showFigure]);

  const [inputs, setInputs] = useState({
    mode: "buy",
    income: 60000,
    size: 3,
    livesInCounty: true,
    worksInCounty: false,
    firstTimeBuyer: false,
  });
  const [hasSearched, setHasSearched] = useState(true);

  const set = (patch) => setInputs((p) => ({ ...p, ...patch }));

  const result = useMemo(() => window.HC.evaluateListings(inputs), [inputs]);

  return (
    <div className="app">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <span className="brand-house" />
        </div>
        <div className="brand-id">
          <div className="brand-wordmark">Valley Housing Fund</div>
          <div className="brand-kicker">Affordable Homes Finder</div>
        </div>
      </div>

      <div className="hero">
        <p className="hero-eyebrow">Creating affordable housing solutions</p>
        <h1 className="hero-title">
          Find a home in the valley you can{" "}
          <span className="accentword">actually afford.</span>
        </h1>
        <div className="hero-rule" aria-hidden="true" />
        <p className="hero-lede">
          Answer six quick questions. We'll show where your household falls on the
          Area Median Income scale and the deed-restricted homes you may qualify
          for — to rent or to buy.
        </p>
      </div>

      <div className="layout">
        <aside className="col-form">
          <FormPanel
            inputs={inputs}
            set={set}
            onSubmit={() => setHasSearched(true)}
          />
        </aside>
        <main className="col-results">
          <Eligibility inputs={inputs} result={result} />
          <Results inputs={inputs} result={result} hasSearched={hasSearched} />
        </main>
      </div>

      <p className="page-disclaimer">
        Figures are illustrative and for demonstration only. Confirm current
        income limits and availability with the Valley Housing Fund.
      </p>

      <TweaksPanel>
        <TweakSection label="Brand" />
        <TweakColor
          label="Accent"
          value={t.accent}
          options={["#189090", "#083840", "#a9bd25", "#2f7d62", "#1c6b8a"]}
          onChange={(v) => setTweak("accent", v)}
        />
        <TweakColor
          label="Page"
          value={t.paper}
          options={["#f4f7f6", "#ffffff", "#eef4f1", "#f1f5ee"]}
          onChange={(v) => setTweak("paper", v)}
        />
        <TweakSection label="Typography" />
        <TweakRadio
          label="Headlines"
          value={t.headlineFont}
          options={["Montserrat", "Poppins", "Open Sans"]}
          onChange={(v) => setTweak("headlineFont", v)}
        />
        <TweakSection label="Listings" />
        <TweakToggle
          label="Show photo panel"
          value={t.showFigure}
          onChange={(v) => setTweak("showFigure", v)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
