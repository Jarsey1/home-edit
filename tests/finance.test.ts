import { describe, expect, it } from "vitest";
import {
  calculateBudget,
  inputsForProperty,
  monthlyPrincipalAndInterest,
  normalizeBudgetInputs,
  withDownAmount,
  withDownPercent,
  withPrice,
} from "../app/lib/finance";
import { DEFAULT_BUDGET_INPUTS } from "../app/lib/v2-types";

describe("mortgage amortization", () => {
  it("matches the standard fixed-rate formula", () => {
    // $300,000 at 6% over 30 years.
    expect(monthlyPrincipalAndInterest(300_000, 6, 30)).toBeCloseTo(1798.65, 2);
  });

  it("handles a zero-interest loan correctly", () => {
    expect(monthlyPrincipalAndInterest(360_000, 0, 30)).toBe(1000);
    expect(monthlyPrincipalAndInterest(180_000, 0, 15)).toBe(1000);
  });

  it("handles a zero loan and a zero term", () => {
    expect(monthlyPrincipalAndInterest(0, 6.5, 30)).toBe(0);
    expect(monthlyPrincipalAndInterest(300_000, 6.5, 0)).toBe(0);
  });
});

describe("budget calculations", () => {
  const inputs = normalizeBudgetInputs({
    ...DEFAULT_BUDGET_INPUTS,
    price: 400_000,
    downPercent: 20,
    downAmount: 80_000,
    rate: 0,
    termYears: 30,
    annualTaxes: 4_800,
    annualInsurance: 1_200,
    monthlyHoa: 0,
    monthlyMaintenance: 0,
    monthlyMortgageInsurance: 0,
    monthlyFloodInsurance: 0,
    monthlyOther: 0,
  });

  it("itemizes principal, taxes, insurance, HOA and reserves", () => {
    const result = calculateBudget(inputs);
    expect(result.monthlyPrincipalInterest).toBeCloseTo(888.89, 2);
    expect(result.breakdown).toHaveLength(8);
    expect(result.totalMonthly).toBeCloseTo(1388.89, 2);
    expect(result.annualCost).toBeCloseTo(16_666.67, 2);
    expect(result.withinTarget).toBe(true);
  });

  it("calculates upfront cash and total interest", () => {
    const result = calculateBudget(inputs);
    expect(result.upfrontCash).toBe(107_850);
    expect(result.totalInterest).toBe(0);
  });

  it("reports the difference from the target budget", () => {
    const result = calculateBudget({
      ...inputs,
      targetMonthly: 1_000,
    });
    expect(result.differenceFromTarget).toBeCloseTo(388.89, 2);
    expect(result.withinTarget).toBe(false);
  });

  it("keeps the down payment percentage and amount synchronized", () => {
    const percent = withDownPercent(inputs, 25);
    expect(percent.downAmount).toBe(100_000);

    const amount = withDownAmount(inputs, 120_000);
    expect(amount.downPercent).toBe(30);

    const price = withPrice(inputs, 500_000);
    expect(price.downPercent).toBe(20);
    expect(price.downAmount).toBe(100_000);
  });

  it("clamps a down payment to the purchase price", () => {
    const result = calculateBudget(
      normalizeBudgetInputs({
        ...inputs,
        price: 300_000,
        downPercent: 20,
        downAmount: 900_000,
      }),
    );
    expect(result.downAmount).toBe(300_000);
    expect(result.loanAmount).toBe(0);
    expect(result.monthlyPrincipalInterest).toBe(0);
  });

  it("keeps monthly, annual, interest and upfront figures consistent", () => {
    const result = calculateBudget({
      ...DEFAULT_BUDGET_INPUTS,
      price: 500_000,
      downPercent: 20,
      downAmount: 100_000,
      rate: 6,
      termYears: 30,
      annualTaxes: 6_000,
      annualInsurance: 1_800,
      monthlyHoa: 200,
      monthlyMaintenance: 100,
    });
    expect(result.annualCost).toBeCloseTo(result.totalMonthly * 12, 6);
    expect(result.totalLoanPayments).toBeCloseTo(
      result.monthlyPrincipalInterest * 360,
      6,
    );
    expect(result.totalInterest).toBeCloseTo(
      result.totalLoanPayments - result.loanAmount,
      6,
    );
    expect(result.upfrontCash).toBe(
      100_000 +
        DEFAULT_BUDGET_INPUTS.closingCosts +
        DEFAULT_BUDGET_INPUTS.inspection +
        DEFAULT_BUDGET_INPUTS.appraisal +
        DEFAULT_BUDGET_INPUTS.moving +
        DEFAULT_BUDGET_INPUTS.initialRepairs,
    );
  });

  it("builds a property-specific scenario without mutating listing data", () => {
    const property = { price: 850_000, hoa: 250 };
    const scenario = inputsForProperty(property, {
      downPercent: 15,
      rate: 5.75,
      termYears: 30,
    });
    expect(scenario.price).toBe(850_000);
    expect(scenario.monthlyHoa).toBe(250);
    expect(scenario.downAmount).toBe(127_500);
    expect(scenario.rate).toBe(5.75);
    expect(property.price).toBe(850_000);
  });
});
