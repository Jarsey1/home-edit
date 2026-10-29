import { describe, expect, it } from "vitest";
import {
  defaultComparisonIds,
  normalizeComparisonIds,
  selectedHomes,
  toggleComparisonId,
} from "../app/lib/comparison";

const homes = [
  { id: "a", address: "A" },
  { id: "b", address: "B" },
  { id: "c", address: "C" },
  { id: "d", address: "D" },
];

describe("comparison selection", () => {
  it("defaults to two properties on narrow mobile screens", () => {
    expect(defaultComparisonIds(homes, 2)).toEqual(["a", "b"]);
  });

  it("keeps a minimum of two selected properties", () => {
    const selected = ["a", "b"];
    expect(toggleComparisonId(homes, selected, "a", 2)).toEqual(["a", "b"]);
  });

  it("adds and removes extra properties while preserving order", () => {
    const added = toggleComparisonId(homes, ["a", "b"], "d", 2);
    expect(added).toEqual(["a", "b", "d"]);
    expect(toggleComparisonId(homes, added, "b", 2)).toEqual(["a", "d"]);
  });

  it("supports three or more properties", () => {
    const selected = toggleComparisonId(
      homes,
      toggleComparisonId(homes, ["a", "b"], "c", 2),
      "d",
      2,
    );
    expect(selected).toHaveLength(4);
    expect(selectedHomes(homes, selected, 2).map((home) => home.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("normalizes stale ids after a property is removed", () => {
    expect(normalizeComparisonIds(homes, ["b", "removed"], 2)).toEqual(["b"]);
    expect(normalizeComparisonIds(homes, ["removed"], 2)).toEqual(["a", "b"]);
  });
});
