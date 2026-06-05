import { NextResponse } from "next/server";
import { fetchSheetData } from "@/lib/sheet-data";
import { getAMIPercent } from "@/lib/ami-engine";
import { matchListings } from "@/lib/eligibility-matcher";
import type { UserProfile } from "@/lib/eligibility-matcher";
import type { SheetData } from "@/lib/sheet-data";

let cache: { data: SheetData; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

async function getSheetData(): Promise<SheetData> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }
  const data = await fetchSheetData();
  cache = { data, fetchedAt: Date.now() };
  return data;
}

function validateProfile(
  body: unknown
): { profile: UserProfile } | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object" };
  }

  const b = body as Record<string, unknown>;

  if (b.listingType !== "rental" && b.listingType !== "ownership") {
    return { error: 'listingType must be "rental" or "ownership"' };
  }
  if (typeof b.annualIncome !== "number" || b.annualIncome < 0) {
    return { error: "annualIncome must be a non-negative number" };
  }
  if (typeof b.householdSize !== "number" || b.householdSize < 1) {
    return { error: "householdSize must be a number >= 1" };
  }
  if (typeof b.countyResident !== "boolean") {
    return { error: "countyResident must be a boolean" };
  }
  if (typeof b.countyEmployee !== "boolean") {
    return { error: "countyEmployee must be a boolean" };
  }
  if (
    b.firstTimeBuyer !== undefined &&
    typeof b.firstTimeBuyer !== "boolean"
  ) {
    return { error: "firstTimeBuyer must be a boolean if provided" };
  }

  return {
    profile: {
      listingType: b.listingType,
      annualIncome: b.annualIncome,
      householdSize: b.householdSize,
      countyResident: b.countyResident,
      countyEmployee: b.countyEmployee,
      firstTimeBuyer: b.firstTimeBuyer as boolean | undefined,
    },
  };
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = validateProfile(body);
  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { profile } = validation;

  try {
    const { listings, amiTable } = await getSheetData();
    const amiPercent = getAMIPercent(
      profile.householdSize,
      profile.annualIncome,
      amiTable
    );
    const matched = matchListings(profile, listings, amiPercent);
    return NextResponse.json({ listings: matched, amiPercent });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
