import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Listing } from "@/lib/eligibility-matcher";
import type { AMITable } from "@/lib/ami-engine";

vi.mock("@/lib/sheet-data");

import { fetchSheetData } from "@/lib/sheet-data";
import { POST } from "../route";

// 3-person household AMI limits matching the real Gunnison County structure
const TEST_AMI_TABLE: AMITable = {
  3: { 30: 30400, 50: 50650, 60: 60750, 80: 81000, 100: 101250, 120: 121500 },
  4: { 30: 33750, 50: 56250, 60: 67500, 80: 90000, 100: 112500, 120: 135000 },
};

const BASE_LISTING: Listing = {
  listing_id: "001",
  listing_name: "123 Main St",
  type: "rental",
  ami_max_percent: 80,
  county_residency_required: false,
  county_employment_required: false,
  first_time_buyer_required: false,
  bedrooms: 2,
  monthly_rent: 1200,
  status: "available",
  contact_info: "housing@gunnisoncounty.org",
};

const BASE_PROFILE = {
  listingType: "rental" as const,
  annualIncome: 60_000,
  householdSize: 3,
  countyResident: true,
  countyEmployee: false,
  firstTimeBuyer: false,
};

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Each test moves forward 30 minutes from the last, guaranteeing the module-level
// cache (TTL = 5 min) is always expired at the start of a test.
let epoch = 0;

beforeEach(() => {
  epoch += 30 * 60 * 1000;
  vi.useFakeTimers();
  vi.setSystemTime(epoch);
  vi.mocked(fetchSheetData).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("POST /api/match", () => {
  it("returns matched listings for a valid profile", async () => {
    vi.mocked(fetchSheetData).mockResolvedValue({
      listings: [BASE_LISTING],
      amiTable: TEST_AMI_TABLE,
    });

    const res = await POST(makeRequest(BASE_PROFILE));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.listings).toHaveLength(1);
    expect(body.listings[0].listing_id).toBe("001");
    expect(typeof body.amiPercent).toBe("number");
  });

  it("returns 400 when listingType is missing", async () => {
    const { listingType: _, ...noType } = BASE_PROFILE;
    const res = await POST(makeRequest(noType));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 400 when annualIncome is a string instead of a number", async () => {
    const res = await POST(makeRequest({ ...BASE_PROFILE, annualIncome: "lots" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when householdSize is less than 1", async () => {
    const res = await POST(makeRequest({ ...BASE_PROFILE, householdSize: 0 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when countyResident is not a boolean", async () => {
    const res = await POST(makeRequest({ ...BASE_PROFILE, countyResident: "yes" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for malformed JSON", async () => {
    const req = new Request("http://localhost/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("fetches sheet data only once for two requests within the cache TTL", async () => {
    vi.mocked(fetchSheetData).mockResolvedValue({
      listings: [BASE_LISTING],
      amiTable: TEST_AMI_TABLE,
    });

    await POST(makeRequest(BASE_PROFILE));
    await POST(makeRequest(BASE_PROFILE));

    expect(vi.mocked(fetchSheetData)).toHaveBeenCalledTimes(1);
  });

  it("re-fetches sheet data after the 5-minute TTL expires", async () => {
    vi.mocked(fetchSheetData).mockResolvedValue({
      listings: [BASE_LISTING],
      amiTable: TEST_AMI_TABLE,
    });

    await POST(makeRequest(BASE_PROFILE));
    vi.advanceTimersByTime(6 * 60 * 1000); // expire the cache
    await POST(makeRequest(BASE_PROFILE));

    expect(vi.mocked(fetchSheetData)).toHaveBeenCalledTimes(2);
  });
});
