import { describe, expect, it } from "vitest";
import {
  activeWishlist,
  defaultRequirements,
  duplicateWishlist,
  requirementsFromLegacy,
  requirementsFor,
  wishlistSetupProgress,
} from "../app/lib/wishlists";
import type { WishlistItem } from "../app/lib/types";
import type { Wishlist } from "../app/lib/v2-types";

describe("wishlist management", () => {
  const wishlist: Wishlist = {
    id: "w1",
    name: "Our Next Home",
    isActive: true,
    budget: 900_000,
    createdAt: "",
    updatedAt: "",
  };

  it("creates an independent set of preferences per wishlist", () => {
    const requirements = defaultRequirements("w1");
    expect(requirements.every((entry) => entry.wishlistId === "w1")).toBe(true);
    expect(requirementsFor(requirements, "w1")).toHaveLength(requirements.length);
    expect(requirementsFor(requirements, "w2")).toHaveLength(0);
  });

  it("duplicates a wishlist with new ids and copied values", () => {
    const requirements = defaultRequirements("w1");
    const copy = duplicateWishlist(wishlist, requirements, "Forever Home");

    expect(copy.wishlist.name).toBe("Forever Home");
    expect(copy.wishlist.isActive).toBe(false);
    expect(copy.wishlist.budget).toBe(900_000);
    expect(copy.requirements).toHaveLength(requirements.length);
    expect(copy.requirements.every((entry) => entry.wishlistId === copy.wishlist.id)).toBe(
      true,
    );
    expect(copy.requirements.some((entry) => requirements.some((source) => source.id === entry.id))).toBe(
      false,
    );
  });

  it("imports legacy must/nice items and preserves checked state", () => {
    const legacy: WishlistItem[] = [
      {
        id: "m1",
        kind: "must",
        category: null,
        label: "3+ bedrooms",
        done: true,
        position: 0,
      },
      {
        id: "m2",
        kind: "must",
        category: null,
        label: "Good school district",
        done: false,
        position: 1,
      },
      {
        id: "n1",
        kind: "nice",
        category: null,
        label: "Pool",
        done: true,
        position: 0,
      },
      {
        id: "c1",
        kind: "category",
        category: "Kitchen",
        label: "Kitchen island",
        done: true,
        position: 0,
      },
    ];

    const requirements = requirementsFromLegacy("w1", legacy);
    const bedrooms = requirements.find((entry) => entry.featureKey === "beds");
    const schools = requirements.find((entry) => entry.featureKey === "goodSchools");
    const pool = requirements.find((entry) => entry.featureKey === "pool");
    const kitchenIsland = requirements.find((entry) => entry.name === "Kitchen island");

    expect(bedrooms).toMatchObject({
      type: "min",
      expectedValue: 3,
      importance: "must",
      configured: true,
    });
    expect(schools?.configured).toBe(false);
    expect(pool?.importance).toBe("nice");
    // Checked category ideas are preserved for reference but excluded from the
    // weighted score until the user promotes them.
    expect(kitchenIsland).toMatchObject({
      importance: "ignore",
      configured: true,
    });
    // Financial and dealbreaker examples are available as unconfigured drafts.
    expect(
      requirements.some(
        (entry) => entry.importance === "dealbreaker" && entry.configured === false,
      ),
    ).toBe(true);
  });

  it("switches the active wishlist without changing the others", () => {
    const next: Wishlist = {
      id: "w2",
      name: "Investment Property",
      isActive: true,
      budget: null,
      createdAt: "",
      updatedAt: "",
    };
    expect(activeWishlist([{ ...wishlist, isActive: false }, next])?.id).toBe("w2");
    expect(activeWishlist([])).toBeNull();

    const all = [...defaultRequirements("w1"), ...defaultRequirements("w2")];
    expect(requirementsFor(all, "w1")).toHaveLength(13);
    expect(requirementsFor(all, "w2")).toHaveLength(13);
    expect(requirementsFor(all, "w2").every((entry) => entry.wishlistId === "w2")).toBe(
      true,
    );
  });

  it("reports setup progress separately from property matches", () => {
    const requirements = defaultRequirements("w1");
    const withDrafts = requirements.map((entry, index) => ({
      ...entry,
      configured: index < 3,
    }));
    const progress = wishlistSetupProgress(withDrafts);
    expect(progress.configured).toBe(3);
    expect(progress.total).toBe(withDrafts.length);
    expect(progress.percent).toBeCloseTo((3 / withDrafts.length) * 100, 6);
  });
});
