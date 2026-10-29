import {
  DEFAULT_INSURANCE_RATE,
  DEFAULT_MAINTENANCE_RATE,
  DEFAULT_TAX_RATE,
} from "./config";
import {
  DEFAULT_BUDGET_INPUTS,
  type BudgetInputs,
} from "./v2-types";

export type BudgetBreakdownKey =
  | "principalInterest"
  | "propertyTaxes"
  | "insurance"
  | "floodInsurance"
  | "mortgageInsurance"
  | "hoa"
  | "maintenance"
  | "other";

export type BudgetBreakdownItem = {
  key: BudgetBreakdownKey;
  amount: number;
};

export type BudgetResult = {
  price: number;
  downAmount: number;
  downPercent: number;
  loanAmount: number;
  monthlyPrincipalInterest: number;
  breakdown: BudgetBreakdownItem[];
  totalMonthly: number;
  annualCost: number;
  upfrontCash: number;
  differenceFromTarget: number | null;
  totalInterest: number;
  totalLoanPayments: number;
  withinTarget: boolean | null;
};

export function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function roundCurrency(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

/**
 * Standard fixed-rate amortization formula:
 * M = P × [r(1+r)^n] / [(1+r)^n − 1]
 *
 * A zero-interest loan is handled separately (simple division), so the
 * formula never divides by zero.
 */
export function monthlyPrincipalAndInterest(
  loanAmount: number,
  annualRatePercent: number,
  termYears: number,
): number {
  const principal = Math.max(0, Number.isFinite(loanAmount) ? loanAmount : 0);
  if (principal === 0) return 0;

  const payments = Math.round(termYears * 12);
  if (!Number.isFinite(payments) || payments <= 0) return 0;

  const monthlyRate = annualRatePercent / 100 / 12;
  if (!Number.isFinite(monthlyRate) || monthlyRate <= 0) {
    return principal / payments;
  }

  const factor = Math.pow(1 + monthlyRate, payments);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function normalizeBudgetInputs(inputs: Partial<BudgetInputs>): BudgetInputs {
  const merged: BudgetInputs = { ...DEFAULT_BUDGET_INPUTS, ...inputs };
  const price = Math.max(0, merged.price || 0);
  const downPercent = clamp(merged.downPercent, 0, 100);
  const downAmount = clamp(merged.downAmount, 0, price);

  return {
    ...merged,
    price,
    downPercent,
    downAmount,
    rate: Math.max(0, merged.rate),
    termYears: Math.max(0, merged.termYears),
    annualTaxes: Math.max(0, merged.annualTaxes),
    annualInsurance: Math.max(0, merged.annualInsurance),
    monthlyHoa: Math.max(0, merged.monthlyHoa),
    monthlyMaintenance: Math.max(0, merged.monthlyMaintenance),
    monthlyMortgageInsurance: Math.max(0, merged.monthlyMortgageInsurance),
    monthlyFloodInsurance: Math.max(0, merged.monthlyFloodInsurance),
    monthlyOther: Math.max(0, merged.monthlyOther),
    targetMonthly: Math.max(0, merged.targetMonthly),
    closingCosts: Math.max(0, merged.closingCosts),
    inspection: Math.max(0, merged.inspection),
    appraisal: Math.max(0, merged.appraisal),
    moving: Math.max(0, merged.moving),
    initialRepairs: Math.max(0, merged.initialRepairs),
  };
}

export function withDownPercent(
  inputs: BudgetInputs,
  percent: number,
): BudgetInputs {
  const price = Math.max(0, inputs.price);
  const downPercent = clamp(percent, 0, 100);
  return {
    ...inputs,
    downPercent,
    downAmount: roundCurrency((price * downPercent) / 100),
  };
}

export function withDownAmount(
  inputs: BudgetInputs,
  amount: number,
): BudgetInputs {
  const price = Math.max(0, inputs.price);
  const downAmount = clamp(amount, 0, price);
  return {
    ...inputs,
    downAmount,
    downPercent: price > 0 ? (downAmount / price) * 100 : 0,
  };
}

/** Keep the percentage when the price changes; the dollar amount follows. */
export function withPrice(inputs: BudgetInputs, price: number): BudgetInputs {
  const nextPrice = Math.max(0, price);
  return {
    ...inputs,
    price: nextPrice,
    downAmount: roundCurrency((nextPrice * inputs.downPercent) / 100),
  };
}

export function calculateBudget(inputs: BudgetInputs): BudgetResult {
  const normalized = normalizeBudgetInputs(inputs);
  const {
    price,
    downAmount,
    downPercent,
    rate,
    termYears,
    annualTaxes,
    annualInsurance,
    monthlyHoa,
    monthlyMaintenance,
    monthlyMortgageInsurance,
    monthlyFloodInsurance,
    monthlyOther,
    targetMonthly,
    closingCosts,
    inspection,
    appraisal,
    moving,
    initialRepairs,
  } = normalized;

  const loanAmount = Math.max(0, price - downAmount);
  const monthlyPrincipalInterest = monthlyPrincipalAndInterest(
    loanAmount,
    rate,
    termYears,
  );

  const breakdown: BudgetBreakdownItem[] = [
    { key: "principalInterest", amount: monthlyPrincipalInterest },
    { key: "propertyTaxes", amount: annualTaxes / 12 },
    { key: "insurance", amount: annualInsurance / 12 },
    { key: "floodInsurance", amount: monthlyFloodInsurance },
    { key: "mortgageInsurance", amount: monthlyMortgageInsurance },
    { key: "hoa", amount: monthlyHoa },
    { key: "maintenance", amount: monthlyMaintenance },
    { key: "other", amount: monthlyOther },
  ];

  const totalMonthly = breakdown.reduce((sum, item) => sum + item.amount, 0);
  const payments = Math.max(0, Math.round(termYears * 12));
  const totalLoanPayments = monthlyPrincipalInterest * payments;
  const totalInterest = Math.max(0, totalLoanPayments - loanAmount);

  return {
    price,
    downAmount,
    downPercent,
    loanAmount,
    monthlyPrincipalInterest,
    breakdown,
    totalMonthly,
    annualCost: totalMonthly * 12,
    upfrontCash:
      downAmount + closingCosts + inspection + appraisal + moving + initialRepairs,
    differenceFromTarget:
      targetMonthly > 0 ? totalMonthly - targetMonthly : null,
    totalInterest,
    totalLoanPayments,
    withinTarget:
      targetMonthly > 0 ? totalMonthly <= targetMonthly : null,
  };
}

/**
 * Build a property-specific scenario. Listing data only fills the price and
 * known HOA; all other figures are clearly user-editable assumptions.
 */
export function inputsForProperty(
  property: { price: number; hoa: number },
  base: Partial<BudgetInputs> = {},
): BudgetInputs {
  const price = Math.max(0, property.price || 0);
  const downPercent = base.downPercent ?? DEFAULT_BUDGET_INPUTS.downPercent;
  const merged = normalizeBudgetInputs({
    ...base,
    price,
    downAmount: roundCurrency((price * downPercent) / 100),
    monthlyHoa: property.hoa > 0 ? property.hoa : 0,
    annualTaxes:
      base.annualTaxes && base.annualTaxes > 0
        ? base.annualTaxes
        : roundCurrency(price * DEFAULT_TAX_RATE),
    annualInsurance:
      base.annualInsurance && base.annualInsurance > 0
        ? base.annualInsurance
        : roundCurrency(price * DEFAULT_INSURANCE_RATE),
    monthlyMaintenance:
      base.monthlyMaintenance && base.monthlyMaintenance > 0
        ? base.monthlyMaintenance
        : roundCurrency((price * DEFAULT_MAINTENANCE_RATE) / 12),
  });
  return merged;
}

/** Monthly ownership cost used by matching and comparison. */
export function estimateMonthlyCost(
  inputs: BudgetInputs,
): number {
  return calculateBudget(inputs).totalMonthly;
}
