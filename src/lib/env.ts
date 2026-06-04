export type EnvConfig = {
  listingsCsvUrl: string;
  amiTableCsvUrl: string;
};

export function getEnvConfig(): EnvConfig {
  const missing = (["LISTINGS_CSV_URL", "AMI_TABLE_CSV_URL"] as const).filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    listingsCsvUrl: process.env.LISTINGS_CSV_URL!,
    amiTableCsvUrl: process.env.AMI_TABLE_CSV_URL!,
  };
}
