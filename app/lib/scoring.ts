import {
  DEFAULT_WEIGHTS,
  type FactValue,
  type Importance,
  type PropertyFacts,
  type RequirementType,
  type WishlistRequirement,
} from "./v2-types";
import { isRequirementScoreable } from "./requirement-config";

export type EvaluationState = "met" | "not-met" | "unknown";

export type EvaluationSource = "property" | "manual" | "none";

export type RequirementEvaluation = {
  requirement: WishlistRequirement;
  /** The state used for scoring (manual observations win). */
  state: EvaluationState;
  /** What the stored property facts say. */
  automaticState: EvaluationState;
  /** A saved manual observation, or null. */
  manualState: EvaluationState | null;
  source: EvaluationSource;
  /** Manual answer disagrees with verified property data. */
  conflict: boolean;
  /** True when this confirmed evaluation disqualifies the property. */
  disqualifying: boolean;
  weight: number;
  actual: FactValue;
};

export type ScoreStatus =
  | "disqualified"
  | "missing-must"
  | "awaiting-verification"
  | "meets-all-must"
  | "no-must-haves"
  | "insufficient";

export type ScoreResult = {
  /** Raw 0–100 score, or null when nothing could be evaluated. */
  score: number | null;
  /** Display score after rounding. */
  scoreRounded: number | null;
  /** Percentage of weighted must/nice preferences that were evaluated. */
  coverage: number;
  evaluatedWeight: number;
  totalWeight: number;
  evaluatedCount: number;
  totalCount: number;
  metCount: number;
  notMetCount: number;
  unknownCount: number;
  mustTotal: number;
  mustMet: WishlistRequirement[];
  mustMissing: WishlistRequirement[];
  mustUnknown: WishlistRequirement[];
  dealbreakersTotal: number;
  dealbreakersChecked: number;
  dealbreakersUnknown: WishlistRequirement[];
  confirmedDealbreakers: WishlistRequirement[];
  disqualified: boolean;
  status: ScoreStatus;
  evaluations: RequirementEvaluation[];
  /** Requirements skipped because they are not configured or not important. */
  skippedCount: number;
};

export type ScoringWeights = Record<Importance, number>;

export type ScoreOptions = {
  /**
   * Manual evaluation responses keyed by requirement id. Property facts are
   * never modified; responses are layered on top for scoring.
   */
  manual?: Record<string, EvaluationState>;
};

export const EMPTY_SCORE: ScoreResult = {
  score: null,
  scoreRounded: null,
  coverage: 0,
  evaluatedWeight: 0,
  totalWeight: 0,
  evaluatedCount: 0,
  totalCount: 0,
  metCount: 0,
  notMetCount: 0,
  unknownCount: 0,
  mustTotal: 0,
  mustMet: [],
  mustMissing: [],
  mustUnknown: [],
  dealbreakersTotal: 0,
  dealbreakersChecked: 0,
  dealbreakersUnknown: [],
  confirmedDealbreakers: [],
  disqualified: false,
  status: "insufficient",
  evaluations: [],
  skippedCount: 0,
};

export function requirementWeight(
  requirement: Pick<WishlistRequirement, "importance" | "weight">,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): number {
  if (
    requirement.weight !== null &&
    Number.isFinite(requirement.weight) &&
    requirement.weight >= 0
  ) {
    return requirement.weight;
  }
  return weights[requirement.importance] ?? 0;
}

function normalize(value: FactValue): string {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
}

function asNumber(value: FactValue): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.+-]/g, "").trim();
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asBoolean(value: FactValue): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1 ? true : value === 0 ? false : null;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "y", "1", "si", "sí"].includes(normalized)) return true;
    if (["false", "no", "n", "0"].includes(normalized)) return false;
  }
  return null;
}

function textValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  if (value === null || value === undefined) return [];
  return [String(value).trim()].filter(Boolean);
}

/**
 * Evaluate one requirement against a property's stored facts.
 *
 * Anything the property has not supplied evaluates to `unknown`; unknown is
 * never treated as a failure.
 */
export function evaluateRequirement(
  requirement: WishlistRequirement,
  facts: PropertyFacts,
): EvaluationState {
  const actual = facts[requirement.featureKey];
  if (actual === null || actual === undefined || actual === "") return "unknown";

  const expected = requirement.expectedValue;
  const type: RequirementType = requirement.type;

  if (type === "yes") {
    if (typeof expected !== "boolean") return "unknown";
    const actualBoolean = asBoolean(actual);
    if (actualBoolean === null) return "unknown";
    return actualBoolean === expected ? "met" : "not-met";
  }

  if (type === "min" || type === "max") {
    const expectedNumber = asNumber(expected as FactValue);
    const actualNumber = asNumber(actual);
    if (expectedNumber === null || actualNumber === null) return "unknown";
    if (type === "min") {
      return actualNumber >= expectedNumber ? "met" : "not-met";
    }
    return actualNumber <= expectedNumber ? "met" : "not-met";
  }

  if (type === "range") {
    if (typeof expected !== "object" || expected === null || Array.isArray(expected)) {
      return "unknown";
    }
    const { min, max } = expected as { min: number; max: number };
    const actualNumber = asNumber(actual);
    if (!Number.isFinite(min) || !Number.isFinite(max) || actualNumber === null) {
      return "unknown";
    }
    return actualNumber >= min && actualNumber <= max ? "met" : "not-met";
  }

  if (type === "text") {
    const wanted = textValues(
      typeof expected === "object" && expected !== null && !Array.isArray(expected)
        ? (expected as { values?: string[] }).values
        : expected,
    ).map((entry) => entry.toLowerCase());
    if (wanted.length === 0) return "unknown";
    const actualText = normalize(actual);
    if (!actualText) return "unknown";
    return wanted.includes(actualText) ? "met" : "not-met";
  }

  if (type === "exclude") {
    const excluded = textValues(expected).map((entry) => entry.toLowerCase());
    if (excluded.length === 0) return "unknown";
    const actualText = normalize(actual);
    if (!actualText) return "unknown";
    // `met` means the excluded condition is present.
    return excluded.some((entry) => actualText.includes(entry)) ? "met" : "not-met";
  }

  return "unknown";
}

function isDisqualifying(requirement: WishlistRequirement, state: EvaluationState) {
  if (state === "unknown") return false;
  // Exclusion dealbreakers disqualify when the excluded value is present.
  // Every other dealbreaker disqualifies when its condition is not met.
  return requirement.type === "exclude" ? state === "met" : state === "not-met";
}

/**
 * Deterministic weighted compatibility score.
 *
 * Match = weighted points earned / weighted points evaluated × 100
 *
 * Only configured, complete must-have and nice-to-have requirements contribute
 * to the weighted score. Dealbreakers are hard filters and not important or
 * incomplete items are excluded. Unknown values are included in the coverage
 * denominator but never in the evaluated denominator.
 */
export function scoreRequirements(
  requirements: WishlistRequirement[],
  facts: PropertyFacts,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
  options: ScoreOptions = {},
): ScoreResult {
  const active = requirements.filter(isRequirementScoreable);
  const skippedCount = requirements.length - active.length;

  if (active.length === 0) {
    return { ...EMPTY_SCORE, skippedCount };
  }

  const evaluations: RequirementEvaluation[] = active.map((requirement) => {
    const automaticState = evaluateRequirement(requirement, facts);
    const savedManual = options.manual?.[requirement.id];
    const manualState =
      savedManual && savedManual !== "unknown" ? savedManual : null;
    const state = manualState ?? automaticState;
    const conflict = Boolean(
      manualState &&
        automaticState !== "unknown" &&
        manualState !== automaticState,
    );
    return {
      requirement,
      state,
      automaticState,
      manualState,
      source:
        manualState !== null
          ? "manual"
          : automaticState === "unknown"
            ? "none"
            : "property",
      conflict,
      disqualifying: isDisqualifying(requirement, state),
      weight: requirementWeight(requirement, weights),
      actual: facts[requirement.featureKey] ?? null,
    };
  });

  const weighted = evaluations.filter(
    (entry) =>
      entry.weight > 0 &&
      entry.requirement.importance !== "dealbreaker" &&
      entry.requirement.importance !== "ignore",
  );
  const mustEvaluations = weighted.filter(
    (entry) => entry.requirement.importance === "must",
  );
  const dealbreakerEvaluations = evaluations.filter(
    (entry) => entry.requirement.importance === "dealbreaker",
  );

  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  const evaluated = weighted.filter((entry) => entry.state !== "unknown");
  const evaluatedWeight = evaluated.reduce((sum, entry) => sum + entry.weight, 0);
  const earnedWeight = evaluated
    .filter((entry) => entry.state === "met")
    .reduce((sum, entry) => sum + entry.weight, 0);

  const score = evaluatedWeight > 0 ? (earnedWeight / evaluatedWeight) * 100 : null;
  const coverage =
    totalWeight > 0 ? (evaluatedWeight / totalWeight) * 100 : 0;

  const mustMet = mustEvaluations
    .filter((entry) => entry.state === "met")
    .map((entry) => entry.requirement);
  const mustMissing = mustEvaluations
    .filter((entry) => entry.state === "not-met")
    .map((entry) => entry.requirement);
  const mustUnknown = mustEvaluations
    .filter((entry) => entry.state === "unknown")
    .map((entry) => entry.requirement);
  const confirmedDealbreakers = dealbreakerEvaluations
    .filter((entry) => entry.disqualifying)
    .map((entry) => entry.requirement);
  const dealbreakersUnknown = dealbreakerEvaluations
    .filter((entry) => entry.state === "unknown")
    .map((entry) => entry.requirement);
  const dealbreakersChecked = dealbreakerEvaluations.filter(
    (entry) => entry.state !== "unknown",
  ).length;

  const disqualified = confirmedDealbreakers.length > 0;

  let status: ScoreStatus;
  if (disqualified) status = "disqualified";
  else if (mustMissing.length > 0) status = "missing-must";
  else if (mustUnknown.length > 0) status = "awaiting-verification";
  else if (mustEvaluations.length > 0) status = "meets-all-must";
  else if (score === null) status = "insufficient";
  else status = "no-must-haves";

  return {
    score,
    scoreRounded: score === null ? null : Math.round(score),
    coverage,
    evaluatedWeight,
    totalWeight,
    evaluatedCount: evaluated.length,
    totalCount: weighted.length,
    metCount: evaluated.filter((entry) => entry.state === "met").length,
    notMetCount: evaluated.filter((entry) => entry.state === "not-met").length,
    unknownCount: weighted.filter((entry) => entry.state === "unknown").length,
    mustTotal: mustEvaluations.length,
    mustMet,
    mustMissing,
    mustUnknown,
    dealbreakersTotal: dealbreakerEvaluations.length,
    dealbreakersChecked,
    dealbreakersUnknown,
    confirmedDealbreakers,
    disqualified,
    status,
    evaluations,
    skippedCount,
  };
}

export type ComparisonCandidate = {
  id: string;
  address: string;
  city?: string;
  score: ScoreResult;
  monthlyCost: number | null;
};

export type ComparisonSummary = {
  highestScore: ComparisonCandidate | null;
  lowestCost: ComparisonCandidate | null;
  mostMustHaves: ComparisonCandidate | null;
  disqualified: ComparisonCandidate[];
  insufficient: ComparisonCandidate[];
  missingInformation: ComparisonCandidate[];
  missingMustHaves: ComparisonCandidate[];
};

/**
 * Deterministic comparison insights. Never claims an objective "best" home:
 * every result is framed as a ranking against the active wishlist.
 */
export function buildComparisonSummary(
  candidates: ComparisonCandidate[],
): ComparisonSummary {
  const eligible = candidates.filter(
    (candidate) => !candidate.score.disqualified && candidate.score.score !== null,
  );
  // Do not name a highest-ranked home when important information is missing.
  const recommendable = eligible.filter(
    (candidate) =>
      candidate.score.coverage >= 50 &&
      candidate.score.mustUnknown.length === 0 &&
      candidate.score.mustMissing.length === 0,
  );

  const highestScore = [...recommendable].sort(
    (a, b) =>
      (b.score.score ?? -1) - (a.score.score ?? -1) ||
      b.score.coverage - a.score.coverage ||
      (a.monthlyCost ?? Number.POSITIVE_INFINITY) -
        (b.monthlyCost ?? Number.POSITIVE_INFINITY),
  )[0] ?? null;

  const lowestCost = [...eligible]
    .filter((candidate) => candidate.monthlyCost !== null)
    .sort(
      (a, b) =>
        (a.monthlyCost ?? Number.POSITIVE_INFINITY) -
        (b.monthlyCost ?? Number.POSITIVE_INFINITY),
    )[0] ?? null;

  const mostMustHaves = [...eligible].sort(
    (a, b) =>
      b.score.mustMet.length - a.score.mustMet.length ||
      (b.score.score ?? -1) - (a.score.score ?? -1),
  )[0] ?? null;

  return {
    highestScore,
    lowestCost,
    mostMustHaves,
    disqualified: candidates.filter((candidate) => candidate.score.disqualified),
    insufficient: candidates.filter(
      (candidate) => !candidate.score.disqualified && candidate.score.score === null,
    ),
    missingMustHaves: candidates.filter(
      (candidate) =>
        !candidate.score.disqualified && candidate.score.mustMissing.length > 0,
    ),
    missingInformation: candidates.filter(
      (candidate) =>
        !candidate.score.disqualified &&
        candidate.score.score !== null &&
        (candidate.score.coverage < 80 ||
          candidate.score.mustUnknown.length > 0 ||
          candidate.score.dealbreakersUnknown.length > 0),
    ),
  };
}
