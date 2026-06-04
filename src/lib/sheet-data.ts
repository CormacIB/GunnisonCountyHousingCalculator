import { getEnvConfig } from "./env";
import { parseListingsCsv, parseAmiTableCsv } from "./csv-parsers";
import type { Listing } from "./eligibility-matcher";
import type { AMITable } from "./ami-engine";

export type SheetData = {
  listings: Listing[];
  amiTable: AMITable;
};

export async function fetchSheetData(): Promise<SheetData> {
  const { listingsCsvUrl, amiTableCsvUrl } = getEnvConfig();

  const [listingsRes, amiRes] = await Promise.all([
    fetch(listingsCsvUrl, { next: { revalidate: 300 } }),
    fetch(amiTableCsvUrl, { next: { revalidate: 300 } }),
  ]);

  if (!listingsRes.ok || !amiRes.ok) {
    throw new Error("Failed to fetch sheet data");
  }

  const [listingsCsv, amiCsv] = await Promise.all([
    listingsRes.text(),
    amiRes.text(),
  ]);

  return {
    listings: parseListingsCsv(listingsCsv),
    amiTable: parseAmiTableCsv(amiCsv),
  };
}
