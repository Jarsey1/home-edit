import type { ScoreResult } from "./scoring";

export type MatchStatus =
  | "not-ready"
  | "insufficient"
  | "disqualified"
  | "partial"
  | "scored";

/**
 * User-facing match status. The weighted score is unchanged; this only
 * distinguishes "no scoreable requirements" from a genuinely partial result.
 */
export function matchStatus(
  score: ScoreResult | null,
  hasScoreableRequirements: boolean,
  hasConfigurationGaps = false,
): MatchStatus {
  if (!hasScoreableRequirements) return "not-ready";
  if (!score || score.score === null) return "insufficient";
  if (score.disqualified) return "disqualified";
  if (hasConfigurationGaps) return "partial";
  if (
    score.mustUnknown.length > 0 ||
    score.dealbreakersUnknown.length > 0 ||
    score.coverage < 100
  ) {
    return "partial";
  }
  return "scored";
}

export type RequirementDisplayStatus =
  | "config-needed"
  | "ready"
  | "met"
  | "not-met"
  | "unknown";

/**
 * Display state for one checklist row. A valid requirement that the user has
 * not activated is "ready", not "incomplete": its expected value and operator
 * are known, it just needs one activation action.
 */
export function requirementDisplayStatus(input: {
  complete: boolean;
  configured: boolean;
  resolved: "met" | "not-met" | "unknown";
}): RequirementDisplayStatus {
  if (!input.complete) return "config-needed";
  if (!input.configured) return "ready";
  return input.resolved;
}
