import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getEnvConfig } from "../env";

describe("getEnvConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns typed config when all required env vars are present", () => {
    process.env.GOOGLE_SHEETS_API_KEY = "test-api-key";
    process.env.GOOGLE_SHEET_ID = "test-sheet-id";

    const config = getEnvConfig();

    expect(config).toEqual({
      googleSheetsApiKey: "test-api-key",
      googleSheetId: "test-sheet-id",
    });
  });

  it("throws a descriptive error naming the missing variable", () => {
    delete process.env.GOOGLE_SHEETS_API_KEY;
    process.env.GOOGLE_SHEET_ID = "test-sheet-id";

    expect(() => getEnvConfig()).toThrow("GOOGLE_SHEETS_API_KEY");
  });

  it("throws naming GOOGLE_SHEET_ID when that var is missing", () => {
    process.env.GOOGLE_SHEETS_API_KEY = "test-api-key";
    delete process.env.GOOGLE_SHEET_ID;

    expect(() => getEnvConfig()).toThrow("GOOGLE_SHEET_ID");
  });

  it("throws naming all missing variables when both are absent", () => {
    delete process.env.GOOGLE_SHEETS_API_KEY;
    delete process.env.GOOGLE_SHEET_ID;

    expect(() => getEnvConfig()).toThrow("GOOGLE_SHEETS_API_KEY");
    expect(() => getEnvConfig()).toThrow("GOOGLE_SHEET_ID");
  });
});
