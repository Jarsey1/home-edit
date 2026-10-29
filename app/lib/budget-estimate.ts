import type { BudgetEstimateStatus } from "./v2-types";

export type BudgetEstimateKey =
  | "price"
  | "hoa"
  | "taxes"
  | "insurance"
  | "maintenance";

export type BudgetEstimateInfo = {
  status: BudgetEstimateStatus;
  missing: BudgetEstimateKey[];
  assumed: BudgetEstimateKey[];
};

/**
 * Estimate reliability is explicit rather than inferred from a total.
 *
 * - partial: the purchase price is unknown, or HOA is unknown and the user has
 *   not accepted the plan assumptions.
 * - assumptions: taxes, insurance and maintenance are labelled estimates.
 * - complete: the user explicitly accepted the plan's assumptions.
 */
export function budgetEstimateInfo(input: {
  price: number;
  hoaKnown: boolean;
  confirmed: boolean;
}): BudgetEstimateInfo {
  if (!Number.isFinite(input.price) || input.price <= 0) {
    return {
      status: "partial",
      missing: ["price"],
      assumed: [],
    };
  }

  if (!input.confirmed && !input.hoaKnown) {
    return {
      status: "partial",
      missing: ["hoa"],
      assumed: ["taxes", "insurance", "maintenance"],
    };
  }

  if (!input.confirmed) {
    return {
      status: "assumptions",
      missing: [],
      assumed: ["taxes", "insurance", "maintenance"],
    };
  }

  return {
    status: "complete",
    missing: [],
    assumed: [],
  };
}

export function budgetEstimateLabelKey(
  status: BudgetEstimateStatus,
): "budget.statusComplete" | "budget.statusAssumptions" | "budget.statusPartial" {
  if (status === "complete") return "budget.statusComplete";
  if (status === "assumptions") return "budget.statusAssumptions";
  return "budget.statusPartial";
}
