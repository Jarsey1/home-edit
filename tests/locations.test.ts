import { describe, expect, it } from "vitest";
import {
  excludedCityKey,
  parsePropertyLocation,
} from "../app/lib/locations";
import { scoreRequirements } from "../app/lib/scoring";
import { createRequirement } from "../app/lib/wishlists";

describe("location matching", () => {
  it("normalizes US cities and states into a stable key", () => {
    expect(parsePropertyLocation("Davie, Florida")).toMatchObject({
      city: "Davie",
      region: "fl",
      country: "United States",
      key: "davie|fl|us",
      verified: true,
    });
    expect(parsePropertyLocation("Miami, FL 33137")).toMatchObject({
      key: "miami|fl|us",
      verified: true,
    });
    expect(excludedCityKey("Davie", "Florida", "United States")).toBe(
      "davie|fl|us",
    );
  });

  it("does not verify a city without a state or region", () => {
    expect(parsePropertyLocation("Davie")).toMatchObject({
      city: "Davie",
      key: null,
      verified: false,
    });
  });

  it("distinguishes the same city in different states", () => {
    expect(parsePropertyLocation("Springfield, Illinois").key).not.toBe(
      parsePropertyLocation("Springfield, Missouri").key,
    );
  });

  it("disqualifies only a verified excluded city", () => {
    const exclusion = createRequirement({
      id: "excluded-cities-w1",
      wishlistId: "w1",
      name: "Cities to avoid",
      category: "location",
      featureKey: "excludedCity",
      type: "exclude",
      expectedValue: { values: ["davie|fl|us"] },
      importance: "dealbreaker",
    });
    const excluded = scoreRequirements([exclusion], {
      excludedCity: "davie|fl|us",
      locationVerified: true,
    });
    expect(excluded.disqualified).toBe(true);
    expect(excluded.confirmedDealbreakers).toHaveLength(1);

    const ambiguous = scoreRequirements([exclusion], {
      excludedCity: null,
      locationVerified: false,
    });
    expect(ambiguous.disqualified).toBe(false);
    expect(ambiguous.dealbreakersUnknown).toHaveLength(1);
  });
});
