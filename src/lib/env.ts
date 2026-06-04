export type EnvConfig = {
  googleSheetsApiKey: string;
  googleSheetId: string;
};

export function getEnvConfig(): EnvConfig {
  const missing = (["GOOGLE_SHEETS_API_KEY", "GOOGLE_SHEET_ID"] as const).filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    googleSheetsApiKey: process.env.GOOGLE_SHEETS_API_KEY!,
    googleSheetId: process.env.GOOGLE_SHEET_ID!,
  };
}
