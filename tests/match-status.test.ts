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

  it("reports partial when requirements exist but facts are unknown", () => {
    const result = scoreRequirements([beds], {});
    expect(matchStatus(result, true)).toBe("partial");
    expect(result.coverage).toBe(0);
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

  it("reports disqualified when a confirmed dealbreaker fails", () => {
    const result = scoreRequirements(
      [beds, dealbreaker],
      { beds: 5, floodZone: true },
    );
    expect(result.disqualified).toBe(true);
    expect(matchStatus(result, true)).toBe("disqualified");
  });

  it("treats draft requirements as incomplete instead of failed", () => {
    const draft: WishlistRequirement = { ...beds, configured: false };
    expect(
      requirementDisplayStatus({ configured: draft.configured !== false, resolved: "met" }),
    ).toBe("incomplete");
    expect(
      requirementDisplayStatus({ configured: true, resolved: "unknown" }),
    ).toBe("unknown");
  });
});
