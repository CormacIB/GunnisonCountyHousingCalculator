export type AMITable = {
  [householdSize: number]: {
    [amiPercent: number]: number;
  };
};

export const OVER_INCOME_AMI = 121;

const AMI_TIERS = [30, 50, 60, 80, 100, 120] as const;

export function getAMIPercent(
  householdSize: number,
  annualIncome: number,
  amiTable: AMITable
): number {
  const limits = amiTable[householdSize];

  for (const tier of AMI_TIERS) {
    if (annualIncome <= limits[tier]) return tier;
  }

  return OVER_INCOME_AMI;
}
