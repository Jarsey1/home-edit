import { describe, expect, it } from "vitest";
import { budgetEstimateInfo } from "../app/lib/budget-estimate";

describe("budget estimate reliability", () => {
  it("marks an unknown purchase price as partial", () => {
    const info = budgetEstimateInfo({
      price: 0,
      hoaKnown: true,
      confirmed: false,
    });
    expect(info.status).toBe("partial");
    expect(info.missing).toContain("price");
  });

  it("marks an unknown HOA as partial until assumptions are accepted", () => {
    const info = budgetEstimateInfo({
      price: 850_000,
      hoaKnown: false,
      confirmed: false,
    });
    expect(info.status).toBe("partial");
    expect(info.missing).toContain("hoa");
  });

  it("labels derived taxes, insurance and maintenance as assumptions", () => {
    const info = budgetEstimateInfo({
      price: 850_000,
      hoaKnown: true,
      confirmed: false,
    });
    expect(info.status).toBe("assumptions");
    expect(info.assumed).toEqual(["taxes", "insurance", "maintenance"]);
    expect(info.missing).toHaveLength(0);
  });

  it("becomes complete after the user accepts the assumptions", () => {
    const info = budgetEstimateInfo({
      price: 850_000,
      hoaKnown: false,
      confirmed: true,
    });
    expect(info.status).toBe("complete");
    expect(info.assumed).toHaveLength(0);
    expect(info.missing).toHaveLength(0);
  });

  it("does not turn a confirmed zero HOA into an unknown", () => {
    const info = budgetEstimateInfo({
      price: 500_000,
      hoaKnown: true,
      confirmed: false,
    });
    expect(info.status).toBe("assumptions");
    expect(info.missing).not.toContain("hoa");
  });
});
