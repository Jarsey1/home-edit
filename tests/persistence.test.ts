import { describe, expect, it } from "vitest";
import { factsFromHome, parseGarageCars, parseLotAcres } from "../app/lib/property-facts";
import type { Home } from "../app/lib/homes";

const baseHome: Home = {
  id: "home-1",
  address: "123 Palm Lane",
  city: "Miami, FL 33137",
  price: 850_000,
  match: 0,
  beds: 4,
  baths: 3,
  sqft: 2_400,
  lot: "0.25 ac",
  garage: "2 cars",
  pool: true,
  gated: true,
  hoa: 350,
  yearBuilt: 2018,
  type: "Single family",
  daysOnMarket: 0,
  imageFilter: "none",
  description: "",
  features: [],
  saved: true,
  tourRequested: false,
};

describe("property facts", () => {
  it("parses legacy lot and garage text", () => {
    expect(parseLotAcres("0.25 ac")).toBe(0.25);
    expect(parseLotAcres("5,000 sq ft")).toBeCloseTo(0.1148, 3);
    expect(parseGarageCars("2 cars")).toBe(2);
    expect(parseGarageCars("")).toBeNull();
  });

  it("turns known home fields into facts", () => {
    const facts = factsFromHome(baseHome, { monthlyOwnershipCost: 4_850 });
    expect(facts.beds).toBe(4);
    expect(facts.city).toBe("Miami");
    expect(facts.excludedCity).toBe("Miami");
    expect(facts.pool).toBe(true);
    expect(facts.lotAcres).toBe(0.25);
    expect(facts.monthlyOwnershipCost).toBe(4_850);
    expect(facts.hoa).toBe(350);
  });

  it("keeps missing optional fields unknown instead of zero", () => {
    const facts = factsFromHome({
      ...baseHome,
      price: 0,
      beds: 0,
      baths: 0,
      sqft: 0,
      hoa: 0,
      yearBuilt: 0,
      city: "",
      lot: "",
      garage: "",
      facts: { pool: null, gated: null },
    });
    expect(facts.price).toBeNull();
    expect(facts.beds).toBeNull();
    expect(facts.hoa).toBeNull();
    expect(facts.city).toBeNull();
    expect(facts.pool).toBeNull();
    expect(facts.gated).toBeNull();
  });

  it("survives JSON persistence with details merged", () => {
    const persisted = JSON.parse(
      JSON.stringify({
        ...baseHome,
        photo: "data:image/jpeg;base64,abc",
        listingUrl: "https://example.com/listing",
        notes: "Loved the light.",
        favorite: true,
        facts: { pool: true, officeSpaces: 2 },
      }),
    ) as Home;

    expect(persisted.photo).toBe("data:image/jpeg;base64,abc");
    expect(persisted.listingUrl).toBe("https://example.com/listing");
    expect(persisted.notes).toBe("Loved the light.");
    expect(persisted.favorite).toBe(true);

    const facts = factsFromHome(persisted);
    expect(facts.pool).toBe(true);
    expect(facts.officeSpaces).toBe(2);
  });
});
