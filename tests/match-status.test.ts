import { describe, expect, it } from "vitest";
import {
  matchStatus,
  requirementDisplayStatus,
} from "../app/lib/match-status";
import { scoreRequirements } from "../app/lib/scoring";
import { createRequirement } from "../app/lib/wishlists";
import type { WishlistRequirement } from "../app/lib/v2-types";

const beds = createRequirement({
  id: "beds",
  wishlistId: "w1",
  name: "At least 4 bedrooms",
  category: "bedrooms",
  featureKey: "beds",
  type: "min",
  expectedValue: 4,
  importance: "must",
});

const garage = createRequirement({
  id: "garage",
  wishlistId: "w1",
  name: "Garage for 2 cars",
  category: "bedrooms",
  featureKey: "garageCars",
  type: "min",
  expectedValue: 2,
  importance: "nice",
});

const dealbreaker = createRequirement({
  id: "flood",
  wishlistId: "w1",
  name: "No flood zone",
  category: "location",
  featureKey: "floodZone",
  type: "yes",
  expectedValue: false,
  importance: "dealbreaker",
});

describe("match status", () => {
  it("reports wishlist not ready when no scoreable requirements exist", () => {
    expect(matchStatus(null, false)).toBe("not-ready");
    expect(matchStatus(scoreRequirements([], {}), false)).toBe("not-ready");
  });

  it("reports insufficient property information when no fact is known", () => {
    const result = scoreRequirements([beds], {});
    expect(matchStatus(result, true)).toBe("insufficient");
    expect(result.coverage).toBe(0);
  });

  it("reports partial when some requirements are known and others are not", () => {
    const result = scoreRequirements([beds, garage], { beds: 5 });
    expect(result.score).not.toBeNull();
    expect(result.coverage).toBeGreaterThan(0);
    expect(result.coverage).toBeLessThan(100);
    expect(matchStatus(result, true)).toBe("partial");
  });

  it("reports scored only when coverage is complete", () => {
    const result = scoreRequirements([beds], { beds: 5 });
    expect(result.coverage).toBe(100);
    expect(matchStatus(result, true)).toBe("scored");

    // Dealbreakers are not part of the weighted coverage, but an unknown
    // dealbreaker still means the property is only partially evaluated.
    const unknownDealbreaker = scoreRequirements(
      [beds, dealbreaker],
      { beds: 5 },
    );
    expect(unknownDealbreaker.coverage).toBe(100);
    expect(unknownDealbreaker.dealbreakersUnknown.length).toBe(1);
    expect(matchStatus(unknownDealbreaker, true)).toBe("partial");
  });

  it("stays partial when another must-have still needs configuration", () => {
    const result = scoreRequirements([beds], { beds: 5 });
    expect(result.coverage).toBe(100);
    expect(matchStatus(result, true, true)).toBe("partial");
    expect(matchStatus(result, true, false)).toBe("scored");
  });

  it("reports disqualified when a confirmed dealbreaker fails", () => {
    const result = scoreRequirements(
      [beds, dealbreaker],
      { beds: 5, floodZone: true },
    );
    expect(result.disqualified).toBe(true);
    expect(matchStatus(result, true)).toBe("disqualified");
  });

  it("distinguishes ready drafts from incomplete requirements", () => {
    const draft: WishlistRequirement = { ...beds, configured: false };
    expect(
      requirementDisplayStatus({
        complete: true,
        configured: draft.configured !== false,
        resolved: "met",
      }),
    ).toBe("ready");
    expect(
      requirementDisplayStatus({
        complete: false,
        configured: draft.configured !== false,
        resolved: "unknown",
      }),
    ).toBe("config-needed");
    expect(
      requirementDisplayStatus({
        complete: true,
        configured: true,
        resolved: "unknown",
      }),
    ).toBe("unknown");
  });
});
