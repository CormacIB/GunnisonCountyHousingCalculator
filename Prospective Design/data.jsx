// ─────────────────────────────────────────────────────────────────────────
// Gunnison Valley Housing — data + eligibility logic
// Figures are illustrative 2025 Area Median Income (AMI) values for the
// Gunnison County region, scaled by household size off a 4-person median.
// ─────────────────────────────────────────────────────────────────────────

// 100% AMI by household size (illustrative)
const AMI_100 = {
  1: 68000,
  2: 77700,
  3: 87400,
  4: 97100,
  5: 104900,
  6: 112700,
  7: 120400,
  8: 128200,
};

function ami100ForSize(size) {
  const s = Math.max(1, Math.min(8, Math.round(size || 1)));
  return AMI_100[s];
}

// Household income as a percentage of AMI for that household size
function amiPercent(income, size) {
  const base = ami100ForSize(size);
  if (!income || income <= 0) return 0;
  return Math.round((income / base) * 100);
}

const fmtMoney = (n) =>
  "$" + Math.round(n).toLocaleString("en-US");

const fmtMoney0 = (n) =>
  "$" + Math.round(n).toLocaleString("en-US");

// Tick marks used on the AMI meter
const AMI_TICKS = [30, 60, 80, 100, 120, 140, 160];

// ─── Sample listings ──────────────────────────────────────────────────────
// requiresLocal: applicant must currently LIVE or WORK in the county
// firstTimeOnly: buy-side, applicant must be a first-time buyer
const LISTINGS = [
  {
    id: "ohio-creek",
    mode: "buy",
    address: "124 Ohio Creek Rd",
    town: "Gunnison",
    beds: 3,
    baths: 2,
    sqft: 1340,
    price: 385000,
    unit: "",
    amiCap: 80,
    requiresLocal: true,
    firstTimeOnly: true,
    program: "Deed-restricted ownership",
    tags: ["Deed-restricted", "Near downtown", "Garage"],
    blurb:
      "A bright three-bedroom on the north side, walkable to Main Street and the Gunnison River trail.",
    contact: "Gunnison Valley Regional Housing Authority",
    phone: "(970) 641-7900",
  },
  {
    id: "belleview",
    mode: "buy",
    address: "210 Belleview Ave",
    town: "Crested Butte",
    beds: 2,
    baths: 1,
    sqft: 980,
    price: 498000,
    unit: "",
    amiCap: 120,
    requiresLocal: true,
    firstTimeOnly: false,
    program: "Affordable ownership",
    tags: ["Deed-restricted", "In-town", "Historic district"],
    blurb:
      "Classic miner's cabin footprint, two blocks off Elk Avenue. Workforce price-capped for the long term.",
    contact: "Town of Crested Butte Housing",
    phone: "(970) 349-5338",
  },
  {
    id: "paradise",
    mode: "buy",
    address: "88 Paradise Rd, Unit 4",
    town: "Mt. Crested Butte",
    beds: 1,
    baths: 1,
    sqft: 720,
    price: 312000,
    unit: "condo",
    amiCap: 140,
    requiresLocal: true,
    firstTimeOnly: false,
    program: "Workforce ownership",
    tags: ["Condo", "Ski access", "Workforce"],
    blurb:
      "Top-floor condo a short walk from the base area — built for people who work on the mountain.",
    contact: "Mt. Crested Butte Housing",
    phone: "(970) 349-6632",
  },
  {
    id: "riverwalk",
    mode: "buy",
    address: "47 Riverwalk Dr",
    town: "Gunnison",
    beds: 3,
    baths: 2.5,
    sqft: 1510,
    price: 429000,
    unit: "townhome",
    amiCap: 100,
    requiresLocal: true,
    firstTimeOnly: true,
    program: "First-time buyer",
    tags: ["Townhome", "First-time buyer", "New build"],
    blurb:
      "Brand-new townhome with an attached garage, reserved for first-time buyers in the valley.",
    contact: "Gunnison Valley Regional Housing Authority",
    phone: "(970) 641-7900",
  },
  {
    id: "birch-glen",
    mode: "buy",
    address: "305 Birch Glen Ct",
    town: "Gunnison",
    beds: 4,
    baths: 2,
    sqft: 1720,
    price: 462000,
    unit: "",
    amiCap: 120,
    requiresLocal: false,
    firstTimeOnly: false,
    program: "Attainable ownership",
    tags: ["Family-sized", "Fenced yard", "Quiet street"],
    blurb:
      "Four bedrooms and a real yard on a cul-de-sac near the schools — room for a growing household.",
    contact: "Gunnison Valley Regional Housing Authority",
    phone: "(970) 641-7900",
  },
  {
    id: "n-main",
    mode: "rent",
    address: "712 N Main St, Apt 2",
    town: "Gunnison",
    beds: 2,
    baths: 1,
    sqft: 860,
    price: 1450,
    unit: "/mo",
    amiCap: 60,
    requiresLocal: true,
    firstTimeOnly: false,
    program: "Income-restricted rental",
    tags: ["Pets OK", "Heat included", "Workforce"],
    blurb:
      "Two-bedroom upper unit with heat included, a block from the bus line and downtown.",
    contact: "Gunnison Valley Regional Housing Authority",
    phone: "(970) 641-7900",
  },
  {
    id: "gothic",
    mode: "rent",
    address: "19 Gothic Ave, Studio C",
    town: "Crested Butte",
    beds: 0,
    baths: 1,
    sqft: 410,
    price: 1150,
    unit: "/mo",
    amiCap: 60,
    requiresLocal: true,
    firstTimeOnly: false,
    program: "Workforce rental",
    tags: ["Studio", "In-town", "Walk to lifts"],
    blurb:
      "Cozy in-town studio for one or two — steps from Elk Avenue and the free shuttle.",
    contact: "Town of Crested Butte Housing",
    phone: "(970) 349-5338",
  },
  {
    id: "tomichi",
    mode: "rent",
    address: "540 Tomichi Ave, Apt 6",
    town: "Gunnison",
    beds: 1,
    baths: 1,
    sqft: 620,
    price: 1290,
    unit: "/mo",
    amiCap: 80,
    requiresLocal: false,
    firstTimeOnly: false,
    program: "Income-restricted rental",
    tags: ["One-bedroom", "Laundry on-site", "Near WSU"],
    blurb:
      "Quiet one-bedroom near Western Colorado University with on-site laundry and covered parking.",
    contact: "Gunnison Valley Regional Housing Authority",
    phone: "(970) 641-7900",
  },
  {
    id: "whetstone",
    mode: "rent",
    address: "33 Whetstone Rd, Unit B",
    town: "Mt. Crested Butte",
    beds: 3,
    baths: 2,
    sqft: 1180,
    price: 2100,
    unit: "/mo",
    amiCap: 100,
    requiresLocal: true,
    firstTimeOnly: false,
    program: "Workforce rental",
    tags: ["Family-sized", "Ski access", "Pets OK"],
    blurb:
      "Three-bedroom for a family that works up the mountain — mudroom, storage, and a sunny deck.",
    contact: "Mt. Crested Butte Housing",
    phone: "(970) 349-6632",
  },
  {
    id: "red-mtn",
    mode: "rent",
    address: "256 Red Mountain Ranch Rd",
    town: "Crested Butte South",
    beds: 2,
    baths: 1.5,
    sqft: 940,
    price: 1680,
    unit: "/mo",
    amiCap: 80,
    requiresLocal: false,
    firstTimeOnly: false,
    program: "Income-restricted rental",
    tags: ["Two-bedroom", "Mountain views", "Storage"],
    blurb:
      "South-valley two-bedroom with big views of Red Mountain and easy access to the highway.",
    contact: "Gunnison County Housing",
    phone: "(970) 641-7900",
  },
];

// ─── Matching logic ─────────────────────────────────────────────────────────
// Returns { eligible:[], why_hidden:{income, residency} counts } given inputs.
function evaluateListings(inputs) {
  const { mode, income, size, livesInCounty, worksInCounty, firstTimeBuyer } =
    inputs;
  const pct = amiPercent(income, size);
  const local = !!(livesInCounty || worksInCounty);

  let hiddenIncome = 0;
  let hiddenResidency = 0;
  let hiddenFirstTime = 0;

  const eligible = [];

  LISTINGS.forEach((l) => {
    if (l.mode !== mode) return;

    const reasons = [];
    if (pct > l.amiCap) reasons.push("income");
    if (l.requiresLocal && !local) reasons.push("residency");
    if (l.mode === "buy" && l.firstTimeOnly && !firstTimeBuyer)
      reasons.push("firsttime");

    if (reasons.length === 0) {
      eligible.push(l);
    } else {
      if (reasons.includes("income")) hiddenIncome++;
      else if (reasons.includes("residency")) hiddenResidency++;
      else if (reasons.includes("firsttime")) hiddenFirstTime++;
    }
  });

  // Sort eligible: tightest cap that still fits first feels most "earned",
  // but users generally want best fit — sort by price ascending.
  eligible.sort((a, b) => a.price - b.price);

  return {
    pct,
    local,
    eligible,
    hidden: {
      income: hiddenIncome,
      residency: hiddenResidency,
      firsttime: hiddenFirstTime,
    },
  };
}

// Round an AMI percentage up to the nearest program tier for messaging
function qualifyingTier(pct) {
  const tiers = [30, 60, 80, 100, 120, 140, 160, 200];
  for (const t of tiers) if (pct <= t) return t;
  return 200;
}

// Darken/lighten a hex color by amt (-1..1)
function shade(hex, amt) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = amt < 0 ? 1 + amt : 1 - amt;
  const t = amt < 0 ? 0 : 255;
  r = Math.round(r * f + t * (1 - f));
  g = Math.round(g * f + t * (1 - f));
  b = Math.round(b * f + t * (1 - f));
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

window.HC = {
  AMI_100,
  AMI_TICKS,
  LISTINGS,
  ami100ForSize,
  amiPercent,
  evaluateListings,
  qualifyingTier,
  fmtMoney,
  fmtMoney0,
  shade,
};
