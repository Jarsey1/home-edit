import { describe, expect, it } from "vitest";
import { buildComparisonSummary } from "../app/lib/scoring";
import { scoreRequirements } from "../app/lib/scoring";
import { createRequirement } from "../app/lib/wishlists";

const requirements = [
  createRequirement({
    id: "must-beds",
    wishlistId: "w1",
    name: "At least 3 bedrooms",
    category: "bedrooms",
    featureKey: "beds",
    type: "min",
    expectedValue: 3,
    importance: "must",
  }),
  createRequirement({
    id: "nice-pool",
    wishlistId: "w1",
    name: "Pool",
    category: "outdoor",
    featureKey: "pool",
    type: "yes",
    expectedValue: true,
    importance: "nice",
  }),
];

describe("comparison summary", () => {
  const good = {
    id: "good",
    address: "1 Good St",
    city: "Miami",
    score: scoreRequirements(requirements, { beds: 4, pool: true }),
    monthlyCost: 5_200,
  };
  const cheap = {
    id: "cheap",
    address: "2 Cheap St",
    city: "Miami",
    score: scoreRequirements(requirements, { beds: 3, pool: false }),
    monthlyCost: 3_900,
  };
  const disqualified = {
    id: "bad",
    address: "3 Bad St",
    city: "Davie",
    score: scoreRequirements(
      [
        ...requirements,
        createRequirement({
          id: "breaker",
          wishlistId: "w1",
          name: "Excluded city",
          category: "location",
          featureKey: "excludedCity",
          type: "exclude",
          expectedValue: "Davie",
          importance: "dealbreaker",
        }),
      ],
      { beds: 5, pool: true, excludedCity: "Davie, FL" },
    ),
    monthlyCost: 2_000,
  };
  const unknown = {
    id: "unknown",
    address: "4 Unknown St",
    city: "Miami",
    score: scoreRequirements(requirements, {}),
    monthlyCost: null,
  };

  it("identifies the highest-scoring eligible home and excludes dealbreakers", () => {
    const summary = buildComparisonSummary([good, cheap, disqualified, unknown]);
    expect(summary.highestScore?.id).toBe("good");
    expect(summary.highestScore?.id).not.toBe("bad");
    expect(summary.disqualified.map((entry) => entry.id)).toEqual(["bad"]);
  });

  it("finds the lowest monthly cost among eligible homes", () => {
    const summary = buildComparisonSummary([good, cheap, disqualified, unknown]);
    expect(summary.lowestCost?.id).toBe("cheap");
  });

  it("finds the home meeting the most must-haves", () => {
    const summary = buildComparisonSummary([good, cheap, disqualified]);
    expect(summary.mostMustHaves?.id).toBe("good");
  });

  it("surfaces properties without enough information", () => {
    const summary = buildComparisonSummary([unknown]);
    expect(summary.insufficient.map((entry) => entry.id)).toEqual(["unknown"]);
    expect(summary.highestScore).toBeNull();
  });

  it("flags limited coverage as missing information", () => {
    const partial = {
      id: "partial",
      address: "5 Partial St",
      city: "Miami",
      score: scoreRequirements(requirements, { beds: 4 }),
      monthlyCost: 4_100,
    };
    const summary = buildComparisonSummary([partial]);
    expect(summary.missingInformation.map((entry) => entry.id)).toEqual([
      "partial",
    ]);
  });
});
