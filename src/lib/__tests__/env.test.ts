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
    process.env.LISTINGS_CSV_URL = "https://example.com/listings.csv";
    process.env.AMI_TABLE_CSV_URL = "https://example.com/ami.csv";

    const config = getEnvConfig();

    expect(config).toEqual({
      listingsCsvUrl: "https://example.com/listings.csv",
      amiTableCsvUrl: "https://example.com/ami.csv",
    });
  });

  it("throws a descriptive error naming the missing variable", () => {
    delete process.env.LISTINGS_CSV_URL;
    process.env.AMI_TABLE_CSV_URL = "https://example.com/ami.csv";

    expect(() => getEnvConfig()).toThrow("LISTINGS_CSV_URL");
  });

  it("throws naming AMI_TABLE_CSV_URL when that var is missing", () => {
    process.env.LISTINGS_CSV_URL = "https://example.com/listings.csv";
    delete process.env.AMI_TABLE_CSV_URL;

    expect(() => getEnvConfig()).toThrow("AMI_TABLE_CSV_URL");
  });

  it("throws naming all missing variables when both are absent", () => {
    delete process.env.LISTINGS_CSV_URL;
    delete process.env.AMI_TABLE_CSV_URL;

    expect(() => getEnvConfig()).toThrow("LISTINGS_CSV_URL");
    expect(() => getEnvConfig()).toThrow("AMI_TABLE_CSV_URL");
  });
});
