import { describe, expect, it } from "vitest";
import {
  normalizeListingUrl,
  parseNumericInput,
  validateHomeDraft,
} from "../app/lib/validation";

const emptyDraft = {
  price: "",
  beds: "",
  baths: "",
  sqft: "",
  hoa: "",
  garageCars: "",
  yearBuilt: "",
  lotAcres: "",
  listingUrl: "",
};

describe("numeric input validation", () => {
  it("distinguishes missing prices from zero", () => {
    expect(parseNumericInput("")).toEqual({ value: null, empty: true, error: null });
    expect(parseNumericInput("0")).toEqual({ value: 0, empty: false, error: null });
  });

  it("rejects negative and non-numeric values", () => {
    expect(parseNumericInput("-5").error).toBe("negative");
    expect(parseNumericInput("abc").error).toBe("invalid");
  });
});

describe("home draft validation", () => {
  it("keeps optional fields unknown when blank", () => {
    const result = validateHomeDraft(emptyDraft);
    expect(result.valid).toBe(true);
    expect(result.values.price).toBeNull();
    expect(result.suspiciousPrice).toBe(false);
  });

  it("flags suspiciously low prices for confirmation", () => {
    const result = validateHomeDraft({ ...emptyDraft, price: "2,000" });
    expect(result.valid).toBe(true);
    expect(result.values.price).toBe(2000);
    expect(result.suspiciousPrice).toBe(true);
  });

  it("uses the configurable $25,000 price warning threshold", () => {
    expect(
      validateHomeDraft({ ...emptyDraft, price: "24999" }).suspiciousPrice,
    ).toBe(true);
    expect(
      validateHomeDraft({ ...emptyDraft, price: "25000" }).suspiciousPrice,
    ).toBe(false);
    expect(
      validateHomeDraft({ ...emptyDraft, price: "20000" }).suspiciousPrice,
    ).toBe(true);
  });

  it("reports negative and invalid numeric fields", () => {
    const result = validateHomeDraft({
      ...emptyDraft,
      price: "-10",
      beds: "lots",
      baths: "-1",
      yearBuilt: "1200",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.price).toBe("negative");
    expect(result.errors.beds).toBe("invalid");
    expect(result.errors.baths).toBe("negative");
    expect(result.errors.yearBuilt).toBe("invalid");
  });

  it("validates listing URLs", () => {
    expect(normalizeListingUrl("example.com/listing")).toBe(
      "https://example.com/listing",
    );
    expect(normalizeListingUrl("https://example.com")).toBe(
      "https://example.com",
    );
    expect(
      validateHomeDraft({ ...emptyDraft, listingUrl: "javascript:alert(1)" })
        .errors.listingUrl,
    ).toBe("url");
  });
});
