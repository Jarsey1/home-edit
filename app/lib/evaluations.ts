import {
  evaluateRequirement,
  type EvaluationState,
} from "./scoring";
import {
  isRequirementScoreable,
  requirementConfigIssue,
  type RequirementConfigIssue,
} from "./requirement-config";
import type {
  PropertyEvaluation,
  PropertyFacts,
  WishlistRequirement,
} from "./v2-types";

export type EvaluationSource = "property" | "manual" | "none";

export type EvaluationRow = {
  requirement: WishlistRequirement;
  automatic: EvaluationState;
  manual: EvaluationState | null;
  /** The state used for scoring. */
  resolved: EvaluationState;
  source: EvaluationSource;
  /** True when a manual answer disagrees with verified property data. */
  conflict: boolean;
  actual: unknown;
  /** Why the requirement cannot be scored, or null when it is complete. */
  configIssue: RequirementConfigIssue | null;
};

export function evaluationId(
  homeId: string,
  wishlistId: string,
  requirementId: string,
) {
  return `${homeId}::${wishlistId}::${requirementId}`;
}

export function manualEvaluationMap(
  evaluations: PropertyEvaluation[],
  homeId: string,
  wishlistId: string,
): Record<string, EvaluationState> {
  const map: Record<string, EvaluationState> = {};
  for (const evaluation of evaluations) {
    if (
      evaluation.homeId !== homeId ||
      evaluation.wishlistId !== wishlistId
    ) {
      continue;
    }
    if (evaluation.state === "met" || evaluation.state === "not-met") {
      map[evaluation.requirementId] = evaluation.state;
    }
  }
  return map;
}

export function buildEvaluationRows(
  requirements: WishlistRequirement[],
  facts: PropertyFacts,
  evaluations: PropertyEvaluation[],
  homeId: string,
  wishlistId: string,
  options: { includeUnconfigured?: boolean } = {},
): EvaluationRow[] {
  const manual = manualEvaluationMap(evaluations, homeId, wishlistId);
  return requirements
    .filter(
      (requirement) =>
        requirement.importance !== "ignore" &&
        (options.includeUnconfigured || isRequirementScoreable(requirement)),
    )
    .map((requirement) => {
      const automatic = evaluateRequirement(requirement, facts);
      const manualState = manual[requirement.id] ?? null;
      const resolved = manualState ?? automatic;
      const conflict = Boolean(
        manualState &&
          automatic !== "unknown" &&
          manualState !== automatic,
      );
      return {
        requirement,
        automatic,
        manual: manualState,
        resolved,
        source:
          manualState !== null ? "manual" : automatic === "unknown" ? "none" : "property",
        conflict,
        actual: facts[requirement.featureKey] ?? null,
        configIssue: requirementConfigIssue(requirement),
      };
    });
}

export function evaluationProgress(rows: EvaluationRow[]) {
  const total = rows.length;
  const answered = rows.filter((row) => row.resolved !== "unknown").length;
  return {
    answered,
    unanswered: total - answered,
    total,
    percent: total > 0 ? (answered / total) * 100 : 0,
  };
}

export function upsertEvaluation(
  evaluations: PropertyEvaluation[],
  next: PropertyEvaluation,
): PropertyEvaluation[] {
  const index = evaluations.findIndex((entry) => entry.id === next.id);
  if (index === -1) return [...evaluations, next];
  return evaluations.map((entry) => (entry.id === next.id ? next : entry));
}

export function removeEvaluation(
  evaluations: PropertyEvaluation[],
  id: string,
): PropertyEvaluation[] {
  return evaluations.filter((entry) => entry.id !== id);
}

export function evaluationFor(
  evaluations: PropertyEvaluation[],
  homeId: string,
  wishlistId: string,
  requirementId: string,
) {
  return (
    evaluations.find(
      (entry) =>
        entry.homeId === homeId &&
        entry.wishlistId === wishlistId &&
        entry.requirementId === requirementId,
    ) ?? null
  );
}
