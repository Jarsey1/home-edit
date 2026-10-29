import type { WishlistRequirement } from "./v2-types";

export type RequirementConfigIssue =
  | "missing-feature"
  | "missing-operator"
  | "missing-expected"
  | "invalid-expected";

const OPERATORS = new Set([
  "yes",
  "min",
  "max",
  "range",
  "text",
  "exclude",
]);

/**
 * A requirement is evaluable only when it has a stable feature key, a known
 * comparison operator and an expected value that the scoring engine can use.
 *
 * `configured` is deliberately not part of this check: it records whether the
 * user has included the requirement in scoring, not whether it is valid.
 */
export function requirementConfigIssue(
  requirement: WishlistRequirement,
): RequirementConfigIssue | null {
  if (!requirement.featureKey || !requirement.featureKey.trim()) {
    return "missing-feature";
  }
  if (!OPERATORS.has(requirement.type)) {
    return "missing-operator";
  }

  const value = requirement.expectedValue;
  switch (requirement.type) {
    case "yes":
      return typeof value === "boolean" ? null : "missing-expected";
    case "min":
    case "max":
      return typeof value === "number" && Number.isFinite(value)
        ? null
        : "missing-expected";
    case "range": {
      if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value) ||
        !("min" in value) ||
        !("max" in value)
      ) {
        return "missing-expected";
      }
      const min = (value as { min: unknown }).min;
      const max = (value as { max: unknown }).max;
      if (
        typeof min !== "number" ||
        typeof max !== "number" ||
        !Number.isFinite(min) ||
        !Number.isFinite(max)
      ) {
        return "missing-expected";
      }
      return min <= max ? null : "invalid-expected";
    }
    case "text":
    case "exclude": {
      if (typeof value === "string") {
        return value.trim() ? null : "missing-expected";
      }
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        "values" in value
      ) {
        const values = (value as { values: unknown }).values;
        return Array.isArray(values) &&
          values.some(
            (entry) => typeof entry === "string" && entry.trim().length > 0,
          )
          ? null
          : "missing-expected";
      }
      return "missing-expected";
    }
    default:
      return "missing-operator";
  }
}

/** True when the requirement has everything scoring needs. */
export function isRequirementComplete(requirement: WishlistRequirement) {
  return requirementConfigIssue(requirement) === null;
}

/** Complete, relevant requirements, whether or not they are enabled. */
export function isRequirementRelevant(requirement: WishlistRequirement) {
  return (
    requirement.importance !== "ignore" &&
    isRequirementComplete(requirement)
  );
}

/** The single eligibility rule used by scoring and evaluation rows. */
export function isRequirementScoreable(requirement: WishlistRequirement) {
  return (
    requirement.configured !== false &&
    isRequirementRelevant(requirement)
  );
}

/** A valid requirement the user has not yet included in scoring. */
export function isRequirementReadyToActivate(
  requirement: WishlistRequirement,
) {
  return (
    requirement.configured === false &&
    isRequirementRelevant(requirement)
  );
}
