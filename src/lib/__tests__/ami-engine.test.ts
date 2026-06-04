import { describe, it, expect } from "vitest";
import { getAMIPercent, OVER_INCOME_AMI } from "../ami-engine";
import type { AMITable } from "../ami-engine";

// Representative Gunnison County AMI table for testing.
// Structure mirrors the real spreadsheet tab 2 — actual figures populated there.
const TEST_AMI_TABLE: AMITable = {
  1: { 30: 23650, 50: 39350, 60: 47250, 80: 63000, 100: 78750, 120: 94500 },
  2: { 30: 27000, 50: 45000, 60: 54000, 80: 72000, 100: 90000, 120: 108000 },
  3: { 30: 30400, 50: 50650, 60: 60750, 80: 81000, 100: 101250, 120: 121500 },
  4: { 30: 33750, 50: 56250, 60: 67500, 80: 90000, 100: 112500, 120: 135000 },
  5: { 30: 36450, 50: 60750, 60: 72900, 80: 97200, 100: 121500, 120: 145800 },
  6: { 30: 39150, 50: 65250, 60: 78300, 80: 104400, 100: 130500, 120: 156600 },
  7: { 30: 41850, 50: 69750, 60: 83700, 80: 111600, 100: 139500, 120: 167400 },
  8: { 30: 44550, 50: 74250, 60: 89100, 80: 118800, 100: 148500, 120: 178200 },
};

describe("getAMIPercent", () => {
  it("returns 50 when a household of 4 earns below the 50% AMI limit", () => {
    // $50,000 is below the 4-person 50% limit of $56,250
    expect(getAMIPercent(4, 50_000, TEST_AMI_TABLE)).toBe(50);
  });

  it("returns 80 when a household of 4 earns between the 60% and 80% AMI limits", () => {
    // $75,000 is above 60% ($67,500) but below 80% ($90,000)
    expect(getAMIPercent(4, 75_000, TEST_AMI_TABLE)).toBe(80);
  });

  it("returns OVER_INCOME_AMI (121) when income exceeds the 120% limit", () => {
    // $200,000 is above the 4-person 120% limit of $135,000
    expect(getAMIPercent(4, 200_000, TEST_AMI_TABLE)).toBe(OVER_INCOME_AMI);
    expect(OVER_INCOME_AMI).toBe(121);
  });

  it("returns the tier when income is exactly at a boundary", () => {
    // $90,000 is exactly the 4-person 80% AMI limit — should qualify at 80%, not 100%
    expect(getAMIPercent(4, 90_000, TEST_AMI_TABLE)).toBe(80);
  });

  it("returns the correct tier for household size 1", () => {
    // $40,000 is above 1-person 30% ($23,650) and 50% ($39,350), below 60% ($47,250)
    expect(getAMIPercent(1, 40_000, TEST_AMI_TABLE)).toBe(60);
  });

  it("returns the correct tier for household size 8", () => {
    // $100,000 is below 8-person 80% limit ($118,800) → returns 80
    expect(getAMIPercent(8, 100_000, TEST_AMI_TABLE)).toBe(80);
    // $150,000 is above 8-person 100% limit ($148,500) but below 120% ($178,200) → returns 120
    expect(getAMIPercent(8, 150_000, TEST_AMI_TABLE)).toBe(120);
  });
});
