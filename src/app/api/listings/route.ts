import { NextResponse } from "next/server";
import { getEnvConfig } from "@/lib/env";
import { parseListingsCsv, parseAmiTableCsv } from "@/lib/csv-parsers";

export async function GET() {
  let config;
  try {
    config = getEnvConfig();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Missing configuration" },
      { status: 500 }
    );
  }

  const [listingsRes, amiRes] = await Promise.all([
    fetch(config.listingsCsvUrl, { next: { revalidate: 300 } }),
    fetch(config.amiTableCsvUrl, { next: { revalidate: 300 } }),
  ]);

  if (!listingsRes.ok || !amiRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch sheet data" },
      { status: 502 }
    );
  }

  const [listingsCsv, amiCsv] = await Promise.all([
    listingsRes.text(),
    amiRes.text(),
  ]);

  const listings = parseListingsCsv(listingsCsv);
  const amiTable = parseAmiTableCsv(amiCsv);

  return NextResponse.json({ listings, amiTable });
}
