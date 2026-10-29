import { describe, expect, it } from "vitest";
import {
  isRequirementComplete,
  isRequirementReadyToActivate,
  isRequirementScoreable,
  requirementConfigIssue,
} from "../app/lib/requirement-config";
import { createRequirement } from "../app/lib/wishlists";
import type { WishlistRequirement } from "../app/lib/v2-types";

function base(
  overrides: Partial<WishlistRequirement> = {},
): WishlistRequirement {
  return {
    ...createRequirement({
      id: "req",
      wishlistId: "w1",
      name: "Garage for 2 cars",
      category: "bedrooms",
      featureKey: "garageCars",
      type: "min",
      expectedValue: 2,
      importance: "must",
    }),
    ...overrides,
  };
}

describe("requirement configuration", () => {
  it("accepts valid conditions and expected values", () => {
    expect(requirementConfigIssue(base())).toBeNull();
    expect(
      requirementConfigIssue(
        base({ type: "yes", featureKey: "centralAir", expectedValue: true }),
      ),
    ).toBeNull();
    expect(
      requirementConfigIssue(
        base({
          type: "range",
          featureKey: "sqft",
          expectedValue: { min: 1500, max: 3000 },
        }),
      ),
    ).toBeNull();
    expect(
      requirementConfigIssue(
        base({ type: "exclude", featureKey: "excludedCity", expectedValue: "Miami" }),
      ),
    ).toBeNull();
  });

  it("reports the specific configuration gap", () => {
    expect(requirementConfigIssue(base({ featureKey: "" }))).toBe(
      "missing-feature",
    );
    expect(requirementConfigIssue(base({ expectedValue: null }))).toBe(
      "missing-expected",
    );
    expect(
      requirementConfigIssue(
        base({ type: "range", expectedValue: { min: 3000, max: 1500 } }),
      ),
    ).toBe("invalid-expected");
    expect(
      requirementConfigIssue(
        base({ type: "exclude", featureKey: "excludedCity", expectedValue: "" }),
      ),
    ).toBe("missing-expected");
  });

  it("separates validity from activation", () => {
    const draft = base({ configured: false });
    expect(isRequirementComplete(draft)).toBe(true);
    expect(isRequirementReadyToActivate(draft)).toBe(true);
    expect(isRequirementScoreable(draft)).toBe(false);

    const active = base({ configured: true });
    expect(isRequirementReadyToActivate(active)).toBe(false);
    expect(isRequirementScoreable(active)).toBe(true);

    const ignored = base({ configured: true, importance: "ignore" });
    expect(isRequirementScoreable(ignored)).toBe(false);
    expect(isRequirementReadyToActivate(ignored)).toBe(false);
  });

  it("never treats an incomplete requirement as active", () => {
    const incomplete = base({ configured: true, expectedValue: null });
    expect(isRequirementComplete(incomplete)).toBe(false);
    expect(isRequirementScoreable(incomplete)).toBe(false);
  });
});
