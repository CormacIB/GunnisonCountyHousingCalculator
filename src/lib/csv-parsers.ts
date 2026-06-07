import type { Listing } from "./eligibility-matcher";
import type { AMITable } from "./ami-engine";

function parseCsvRow(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

// Finds the first row whose values look like column headers (non-numeric, reasonable length).
// Skips title/banner rows that appear above the real header in Google Sheets exports.
function findHeaderRowIndex(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const cells = parseCsvRow(lines[i]);
    // A header row has multiple non-empty, non-numeric cells
    const nonNumeric = cells.filter((c) => c !== "" && isNaN(Number(c)));
    if (nonNumeric.length >= 3) return i;
  }
  return 0;
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split("\n").filter(Boolean);
  const headerIdx = findHeaderRowIndex(lines);
  const headers = parseCsvRow(lines[headerIdx]).map((h) => h.toLowerCase().trim());
  const rows = lines.slice(headerIdx + 1).map(parseCsvRow);
  return { headers, rows };
}

function col(row: string[], headers: string[], ...names: string[]): string {
  for (const name of names) {
    const idx = headers.indexOf(name.toLowerCase());
    if (idx !== -1 && row[idx] !== undefined) return row[idx].trim();
  }
  return "";
}

function toBool(val: string): boolean {
  const v = val.toLowerCase();
  return v === "yes" || v === "true";
}

// Strips $, commas, and % from numeric strings produced by Google Sheets.
function toNumber(val: string): number {
  return Number(val.replace(/[$,%]/g, "").replace(/,/g, "").trim());
}

function toOptionalNumber(val: string): number | undefined {
  if (val === "") return undefined;
  const n = toNumber(val);
  return isNaN(n) ? undefined : n;
}

export function parseListingsCsv(csv: string): Listing[] {
  const { headers, rows } = parseCsv(csv);

  const get = (row: string[], ...names: string[]) => col(row, headers, ...names);

  return rows
    .map((row): Listing => {
      const address = get(row, "address", "listing_name");
      const city = get(row, "city");
      const listing_name = city ? `${address}, ${city}` : address;

      // Determine listing type: explicit "type" column wins; otherwise infer from "property type"
      const typeRaw = get(row, "type", "property type").toLowerCase();
      const type: "rental" | "ownership" =
        typeRaw === "rental" ? "rental" : "ownership";

      // AMI max: strip trailing % sign
      const amiRaw = get(row, "ami_max_percent", "ami % target");
      const ami_max_percent = toNumber(amiRaw);

      // Status: explicit "status" column wins; fall back to "affordable?" yes/no.
      // If neither column exists (empty string), treat the row as available so
      // spreadsheets without a status column still return results.
      const statusRaw = get(row, "status", "affordable?").toLowerCase();
      const status: "available" | "pending" | "unavailable" =
        statusRaw === "available"
          ? "available"
          : statusRaw === "pending"
          ? "pending"
          : statusRaw === "yes"
          ? "available"
          : statusRaw === "no" || statusRaw === "false" || statusRaw === "unavailable"
          ? "unavailable"
          : "available"; // no status column present — default to available

      return {
        listing_id: get(row, "listing_id", "listing id"),
        listing_name,
        type,
        ami_max_percent,
        ami_min_percent: toOptionalNumber(get(row, "ami_min_percent")),
        household_size_min: toOptionalNumber(get(row, "household_size_min")),
        household_size_max: toOptionalNumber(get(row, "household_size_max")),
        county_residency_required: toBool(get(row, "county_residency_required")),
        first_time_buyer_required: toBool(get(row, "first_time_buyer_required")),
        county_income_min_percent: toOptionalNumber(get(row, "county_income_min_percent")),
        no_county_property_required: toBool(get(row, "no_county_property_required")),
        bedrooms: toNumber(get(row, "bedrooms")),
        monthly_rent: toOptionalNumber(get(row, "monthly_rent")),
        purchase_price: toOptionalNumber(
          get(row, "purchase_price", "list price")
        ),
        status,
        contact_info: get(row, "contact_info"),
        notes: get(row, "notes") || undefined,
      };
    })
    .filter((l) => l.status === "available" && !isNaN(l.ami_max_percent));
}

export function parseAmiTableCsv(csv: string): AMITable {
  const { headers, rows } = parseCsv(csv);

  // Detect orientation: rows=tiers, cols=sizes (e.g. "1-person", "2-person")
  // vs. rows=sizes, cols=tiers (e.g. "30", "50", "60"...)
  const hasSizeColumns = headers.some((h) => /\d+-person/.test(h));

  const table: AMITable = {};

  if (hasSizeColumns) {
    // Sheet format: AMI %, [label], 1-Person, 2-Person, ... 8-Person
    const sizeHeaders = headers.filter((h) => /\d+-person/.test(h));

    for (const row of rows) {
      const tierRaw = col(row, headers, "ami %", "ami%").replace("%", "").trim();
      const tier = Number(tierRaw);
      if (isNaN(tier)) continue;

      for (const sizeHeader of sizeHeaders) {
        const size = Number(sizeHeader.replace(/-person/, "").trim());
        const limit = toNumber(col(row, headers, sizeHeader));
        if (!table[size]) table[size] = {};
        table[size][tier] = limit;
      }
    }
  } else {
    // Sheet format: household_size, 30, 50, 60, 80, 100, 120
    const tierHeaders = headers.filter((h) => /^\d+$/.test(h));
    for (const row of rows) {
      const size = Number(col(row, headers, "household_size"));
      if (isNaN(size)) continue;
      table[size] = {};
      for (const tier of tierHeaders) {
        table[size][Number(tier)] = toNumber(col(row, headers, tier));
      }
    }
  }

  return table;
}
