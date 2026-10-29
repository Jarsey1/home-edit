import type { ScoreResult } from "./scoring";

export type MatchStatus =
  | "not-ready"
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
): MatchStatus {
  if (!hasScoreableRequirements) return "not-ready";
  if (!score) return "partial";
  if (score.disqualified) return "disqualified";
  if (score.score === null) return "partial";
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
  | "incomplete"
  | "met"
  | "not-met"
  | "unknown";

export function requirementDisplayStatus(input: {
  configured: boolean;
  resolved: "met" | "not-met" | "unknown";
}): RequirementDisplayStatus {
  if (!input.configured) return "incomplete";
  return input.resolved;
}
