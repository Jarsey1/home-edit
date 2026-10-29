import { describe, expect, it } from "vitest";
import {
  buildEvaluationRows,
  evaluationId,
  evaluationProgress,
  manualEvaluationMap,
  removeEvaluation,
  upsertEvaluation,
} from "../app/lib/evaluations";
import { scoreRequirements } from "../app/lib/scoring";
import { createRequirement } from "../app/lib/wishlists";
import type {
  PropertyEvaluation,
  PropertyFacts,
  WishlistRequirement,
} from "../app/lib/v2-types";

const requirements: WishlistRequirement[] = [
  createRequirement({
    id: "beds",
    wishlistId: "w1",
    name: "At least 3 bedrooms",
    category: "bedrooms",
    featureKey: "beds",
    type: "min",
    expectedValue: 3,
    importance: "must",
  }),
  createRequirement({
    id: "pool",
    wishlistId: "w1",
    name: "Pool",
    category: "outdoor",
    featureKey: "pool",
    type: "yes",
    expectedValue: true,
    importance: "nice",
  }),
  createRequirement({
    id: "office",
    wishlistId: "w1",
    name: "Office",
    category: "bedrooms",
    featureKey: "officeSpaces",
    type: "min",
    expectedValue: 2,
    importance: "must",
  }),
];

function evaluation(
  requirementId: string,
  state: "met" | "not-met",
  wishlistId = "w1",
): PropertyEvaluation {
  return {
    id: evaluationId("home-1", wishlistId, requirementId),
    homeId: "home-1",
    wishlistId,
    requirementId,
    state,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("guided evaluations", () => {
  const facts: PropertyFacts = { beds: 4, pool: true };

  it("automatically answers requirements when facts are known", () => {
    const rows = buildEvaluationRows(
      requirements,
      facts,
      [],
      "home-1",
      "w1",
    );
    expect(rows.find((row) => row.requirement.id === "beds")).toMatchObject({
      automatic: "met",
      resolved: "met",
      source: "property",
      conflict: false,
    });
    expect(rows.find((row) => row.requirement.id === "pool")).toMatchObject({
      automatic: "met",
      resolved: "met",
    });
    expect(rows.find((row) => row.requirement.id === "office")).toMatchObject({
      automatic: "unknown",
      resolved: "unknown",
      source: "none",
    });
  });

  it("uses a manual answer when the property fact is unknown", () => {
    const rows = buildEvaluationRows(
      requirements,
      facts,
      [evaluation("office", "not-met")],
      "home-1",
      "w1",
    );
    const office = rows.find((row) => row.requirement.id === "office");
    expect(office).toMatchObject({
      automatic: "unknown",
      manual: "not-met",
      resolved: "not-met",
      source: "manual",
      conflict: false,
    });
  });

  it("flags a manual answer that conflicts with verified facts", () => {
    const rows = buildEvaluationRows(
      requirements,
      facts,
      [evaluation("beds", "not-met")],
      "home-1",
      "w1",
    );
    const beds = rows.find((row) => row.requirement.id === "beds");
    expect(beds).toMatchObject({
      automatic: "met",
      manual: "not-met",
      resolved: "not-met",
      source: "manual",
      conflict: true,
    });
  });

  it("tracks evaluation progress separately from match coverage", () => {
    const rows = buildEvaluationRows(
      requirements,
      facts,
      [evaluation("office", "not-met")],
      "home-1",
      "w1",
    );
    const progress = evaluationProgress(rows);
    expect(progress).toEqual({
      answered: 3,
      unanswered: 0,
      total: 3,
      percent: 100,
    });
  });

  it("saves and resumes evaluation responses from serialized data", () => {
    const saved = [evaluation("office", "met")];
    const roundTripped = JSON.parse(JSON.stringify(saved)) as PropertyEvaluation[];
    const rows = buildEvaluationRows(
      requirements,
      facts,
      roundTripped,
      "home-1",
      "w1",
    );
    expect(rows.find((row) => row.requirement.id === "office")?.resolved).toBe(
      "met",
    );
    expect(manualEvaluationMap(roundTripped, "home-1", "w1")).toEqual({
      office: "met",
    });
  });

  it("keeps evaluations independent per wishlist", () => {
    const saved = [evaluation("office", "met", "w2")];
    const w1Rows = buildEvaluationRows(
      requirements,
      facts,
      saved,
      "home-1",
      "w1",
    );
    const w2Rows = buildEvaluationRows(
      requirements,
      facts,
      saved,
      "home-1",
      "w2",
    );
    expect(w1Rows.find((row) => row.requirement.id === "office")?.resolved).toBe(
      "unknown",
    );
    expect(w2Rows.find((row) => row.requirement.id === "office")?.resolved).toBe(
      "met",
    );
  });

  it("upserts and removes one response without touching the others", () => {
    const first = [evaluation("office", "met")];
    const replaced = upsertEvaluation(first, evaluation("office", "not-met"));
    expect(replaced).toHaveLength(1);
    expect(replaced[0].state).toBe("not-met");
    expect(removeEvaluation(replaced, replaced[0].id)).toEqual([]);
  });

  it("keeps not-important reference items out of the evaluation workflow", () => {
    const reference = createRequirement({
      id: "reference",
      wishlistId: "w1",
      name: "Kitchen island",
      category: "kitchen",
      featureKey: "kitchenIsland",
      type: "yes",
      expectedValue: true,
      importance: "ignore",
    });
    const rows = buildEvaluationRows(
      [...requirements, reference],
      facts,
      [],
      "home-1",
      "w1",
    );
    expect(rows.some((row) => row.requirement.id === "reference")).toBe(false);
  });

  it("does not require user input when the automatic answer is already known", () => {
    const rows = buildEvaluationRows(
      requirements,
      facts,
      [],
      "home-1",
      "w1",
    );
    const answered = rows.filter((row) => row.resolved !== "unknown");
    expect(answered).toHaveLength(2);
    expect(rows).toHaveLength(3);
  });
});

describe("manual evaluation scoring", () => {
  it("uses manual observations in the weighted score", () => {
    const manual = { office: "met" as const };
    const result = scoreRequirements(requirements, { beds: 4, pool: true }, undefined, {
      manual,
    });
    expect(result.score).toBe(100);
    expect(result.mustUnknown).toHaveLength(0);
    expect(result.status).toBe("meets-all-must");
  });

  it("can confirm a dealbreaker from a manual observation", () => {
    const dealbreaker = createRequirement({
      id: "breaker",
      wishlistId: "w1",
      name: "Excluded city",
      category: "location",
      featureKey: "excludedCity",
      type: "exclude",
      expectedValue: "Davie",
      importance: "dealbreaker",
    });
    const result = scoreRequirements(
      [dealbreaker],
      {},
      undefined,
      { manual: { breaker: "met" } },
    );
    expect(result.disqualified).toBe(true);
  });

  it("recalculates when a manual answer changes", () => {
    const before = scoreRequirements(requirements, { beds: 4, pool: true }, undefined, {
      manual: { office: "not-met" },
    });
    const after = scoreRequirements(requirements, { beds: 4, pool: true }, undefined, {
      manual: { office: "met" },
    });
    expect(before.score).toBeLessThan(after.score ?? 0);
    expect(before.status).toBe("missing-must");
    expect(after.status).toBe("meets-all-must");
  });
});
