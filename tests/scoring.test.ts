import { describe, expect, it } from "vitest";
import { scoreRequirements } from "../app/lib/scoring";
import {
  createRequirement,
  defaultRequirements,
  requirementsFor,
} from "../app/lib/wishlists";
import type {
  PropertyFacts,
  RequirementValue,
  WishlistRequirement,
} from "../app/lib/v2-types";

function requirement(
  id: string,
  importance: WishlistRequirement["importance"],
  featureKey: string,
  options: {
    type?: WishlistRequirement["type"];
    expected?: RequirementValue;
    configured?: boolean;
  } = {},
): WishlistRequirement {
  return createRequirement({
    id,
    wishlistId: "w1",
    name: id,
    category: "interior",
    featureKey,
    type: options.type ?? "yes",
    expectedValue: options.expected ?? true,
    importance,
    configured: options.configured ?? true,
  });
}

describe("match scoring", () => {
  it("uses the weighted formula from the specification (79%)", () => {
    const requirements = [
      ...Array.from({ length: 5 }, (_, index) =>
        requirement(`must-${index}`, "must", `must${index}`),
      ),
      ...Array.from({ length: 4 }, (_, index) =>
        requirement(`nice-${index}`, "nice", `nice${index}`),
      ),
    ];
    const facts: PropertyFacts = {};
    for (let index = 0; index < 5; index += 1) {
      facts[`must${index}`] = index < 4;
    }
    for (let index = 0; index < 4; index += 1) {
      facts[`nice${index}`] = index < 3;
    }

    const result = scoreRequirements(requirements, facts);
    expect(result.score).toBeCloseTo(78.7878, 3);
    expect(result.scoreRounded).toBe(79);
    expect(result.coverage).toBeCloseTo(100, 6);
    expect(result.mustMissing).toHaveLength(1);
    expect(result.status).toBe("missing-must");
  });

  it("treats unknown values as unevaluated, never as failures", () => {
    const requirements = [
      requirement("must-0", "must", "beds", {
        type: "min",
        expected: 3,
      }),
      requirement("must-1", "must", "officeSpaces", {
        type: "min",
        expected: 1,
      }),
      requirement("nice-0", "nice", "pool"),
    ];
    const facts: PropertyFacts = { beds: 4, pool: true };

    const result = scoreRequirements(requirements, facts);
    expect(result.score).toBe(100);
    expect(result.coverage).toBeCloseTo(58.333, 2);
    expect(result.mustUnknown).toHaveLength(1);
    expect(result.status).toBe("awaiting-verification");
    expect(result.notMetCount).toBe(0);
  });

  it("returns no score when nothing has been evaluated", () => {
    const result = scoreRequirements(
      [requirement("must-0", "must", "beds", { type: "min", expected: 3 })],
      {},
    );
    expect(result.score).toBeNull();
    expect(result.scoreRounded).toBeNull();
    expect(result.coverage).toBe(0);
    expect(result.status).toBe("awaiting-verification");
  });

  it("disqualifies a confirmed dealbreaker instead of reducing the score", () => {
    const requirements = [
      requirement("must-0", "must", "beds", { type: "min", expected: 3 }),
      requirement("breaker", "dealbreaker", "excludedCity", {
        type: "exclude",
        expected: "Davie",
      }),
    ];
    const facts: PropertyFacts = { beds: 4, excludedCity: "Davie, FL" };
    const result = scoreRequirements(requirements, facts);

    expect(result.disqualified).toBe(true);
    expect(result.confirmedDealbreakers).toHaveLength(1);
    expect(result.status).toBe("disqualified");
    // A disqualified property can still show its weighted score for context.
    expect(result.score).toBe(100);
  });

  it("does not disqualify when the dealbreaker is unknown", () => {
    const requirements = [
      requirement("breaker", "dealbreaker", "excludedCity", {
        type: "exclude",
        expected: "Davie",
      }),
      requirement("must-0", "must", "beds", { type: "min", expected: 3 }),
    ];
    const result = scoreRequirements(requirements, { beds: 3 });

    expect(result.disqualified).toBe(false);
    expect(result.dealbreakersUnknown).toHaveLength(1);
    expect(result.status).toBe("meets-all-must");
  });

  it("treats a failing numeric dealbreaker as disqualifying", () => {
    const requirements = [
      requirement("hoa-breaker", "dealbreaker", "hoa", {
        type: "max",
        expected: 400,
      }),
    ];
    const result = scoreRequirements(requirements, { hoa: 650 });
    expect(result.disqualified).toBe(true);
  });

  it("excludes not-important requirements from the weighted score", () => {
    const requirements = [
      requirement("must-0", "must", "pool"),
      requirement("ignored", "ignore", "gated"),
    ];
    const result = scoreRequirements(requirements, { pool: true, gated: false });
    expect(result.score).toBe(100);
    expect(result.totalCount).toBe(1);
    expect(result.skippedCount).toBe(0);
  });

  it("skips unconfigured preferences until the user reviews them", () => {
    const requirements = [
      requirement("must-0", "must", "pool"),
      requirement("draft", "must", "gated", { configured: false }),
    ];
    const result = scoreRequirements(requirements, { pool: true, gated: true });
    expect(result.score).toBe(100);
    expect(result.skippedCount).toBe(1);
    expect(result.mustTotal).toBe(1);
  });

  it("scores each wishlist independently against the same property facts", () => {
    const wishlistA = requirementsFor(
      [requirement("a-1", "must", "beds", { type: "min", expected: 4 })],
      "w1",
    );
    const wishlistB = requirementsFor(
      [
        { ...requirement("b-1", "must", "pool"), wishlistId: "w2" },
      ],
      "w2",
    );
    const facts: PropertyFacts = { beds: 3, pool: true };

    expect(scoreRequirements(wishlistA, facts).score).toBe(0);
    expect(scoreRequirements(wishlistB, facts).score).toBe(100);
  });
});

describe("default requirements", () => {
  it("includes must, nice and dealbreaker importance levels", () => {
    const requirements = defaultRequirements("wishlist-test");
    const levels = new Set(requirements.map((entry) => entry.importance));
    expect(levels.has("must")).toBe(true);
    expect(levels.has("nice")).toBe(true);
    expect(levels.has("dealbreaker")).toBe(true);
    expect(requirements.every((entry) => entry.wishlistId === "wishlist-test")).toBe(
      true,
    );
  });
});
