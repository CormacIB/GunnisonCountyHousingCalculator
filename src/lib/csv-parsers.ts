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

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split("\n").filter(Boolean);
  const headers = parseCsvRow(lines[0]).map((h) => h.toLowerCase().trim());
  const rows = lines.slice(1).map(parseCsvRow);
  return { headers, rows };
}

function toBool(val: string): boolean {
  return val.toLowerCase() === "yes";
}

function toOptionalNumber(val: string): number | undefined {
  return val !== "" ? Number(val) : undefined;
}

export function parseListingsCsv(csv: string): Listing[] {
  const { headers, rows } = parseCsv(csv);
  const col = (row: string[], name: string) => row[headers.indexOf(name)] ?? "";

  return rows
    .map((row): Listing => ({
      listing_id: col(row, "listing_id"),
      listing_name: col(row, "listing_name"),
      type: col(row, "type") as "rental" | "ownership",
      ami_max_percent: Number(col(row, "ami_max_percent")),
      ami_min_percent: toOptionalNumber(col(row, "ami_min_percent")),
      household_size_min: toOptionalNumber(col(row, "household_size_min")),
      household_size_max: toOptionalNumber(col(row, "household_size_max")),
      county_residency_required: toBool(col(row, "county_residency_required")),
      county_employment_required: toBool(col(row, "county_employment_required")),
      first_time_buyer_required: toBool(col(row, "first_time_buyer_required")),
      bedrooms: Number(col(row, "bedrooms")),
      monthly_rent: toOptionalNumber(col(row, "monthly_rent")),
      purchase_price: toOptionalNumber(col(row, "purchase_price")),
      status: col(row, "status") as "available" | "pending" | "unavailable",
      contact_info: col(row, "contact_info"),
      notes: col(row, "notes") || undefined,
    }))
    .filter((l) => l.status === "available");
}

export function parseAmiTableCsv(csv: string): AMITable {
  const { headers, rows } = parseCsv(csv);
  const tierHeaders = headers.filter((h) => h !== "household_size");

  const table: AMITable = {};
  for (const row of rows) {
    const col = (name: string) => row[headers.indexOf(name)] ?? "";
    const size = Number(col("household_size"));
    table[size] = {};
    for (const tier of tierHeaders) {
      table[size][Number(tier)] = Number(col(tier));
    }
  }
  return table;
}
