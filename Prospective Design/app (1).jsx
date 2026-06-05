// ─────────────────────────────────────────────────────────────────────────
// Gunnison Valley Housing — App
// ─────────────────────────────────────────────────────────────────────────
const { useState, useMemo, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#2e6b73",
  "headlineFont": "Newsreader",
  "paper": "#f1ede4",
  "showFigure": true
}/*EDITMODE-END*/;

const HEADLINE_FONTS = {
  "Newsreader": '"Newsreader",Georgia,serif',
  "Public Sans": '"Public Sans",system-ui,sans-serif',
  "Spline Mono": '"Spline Sans Mono",ui-monospace,monospace',
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const r = document.documentElement;
    const deep = window.HC.shade(t.accent, -0.16);
    r.style.setProperty("--accent", t.accent);
    r.style.setProperty("--accent-deep", deep);
    r.style.setProperty("--paper", t.paper);
    r.style.setProperty("--serif", HEADLINE_FONTS[t.headlineFont] || HEADLINE_FONTS.Newsreader);
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

      <div className="hero">
        <h1 className="hero-title">
          Find a home in the valley you can actually afford.
        </h1>
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

      <footer className="colophon">
        <span>
          Figures are illustrative and for demonstration only. Confirm current
          income limits and availability with the Housing Authority.
        </span>
        <span className="colophon-mark">GVRHA</span>
      </footer>

      <TweaksPanel>
        <TweakSection label="Identity" />
        <TweakColor
          label="Accent"
          value={t.accent}
          options={["#2e6b73", "#3a6b7a", "#5a7d52", "#a8553a", "#1c2b33"]}
          onChange={(v) => setTweak("accent", v)}
        />
        <TweakColor
          label="Paper"
          value={t.paper}
          options={["#f1ede4", "#f4f3ee", "#f0ece2", "#eef0ee", "#ffffff"]}
          onChange={(v) => setTweak("paper", v)}
        />
        <TweakSection label="Typography" />
        <TweakRadio
          label="Headlines"
          value={t.headlineFont}
          options={["Newsreader", "Public Sans", "Spline Mono"]}
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
