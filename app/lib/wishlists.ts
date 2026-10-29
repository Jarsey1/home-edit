import {
  CATEGORY_ORDER,
  DEFAULT_BUDGET_INPUTS,
  type Importance,
  type RequirementType,
  type RequirementValue,
  type Wishlist,
  type WishlistCategory,
  type WishlistRequirement,
} from "./v2-types";
import type { WishlistItem } from "./types";

export function newId(prefix = "id") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function createWishlist(
  name: string,
  options: { active?: boolean; budget?: number | null } = {},
): Wishlist {
  const timestamp = nowIso();
  return {
    id: newId("wishlist"),
    name: name.trim(),
    isActive: options.active ?? false,
    budget: options.budget ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createRequirement(input: {
  id?: string;
  wishlistId: string;
  name: string;
  category: WishlistCategory;
  featureKey: string;
  type: RequirementType;
  expectedValue: RequirementValue;
  importance: Importance;
  weight?: number | null;
  configured?: boolean;
  position?: number;
  custom?: boolean;
}): WishlistRequirement {
  const timestamp = nowIso();
  return {
    id: input.id ?? newId("req"),
    wishlistId: input.wishlistId,
    category: input.category,
    name: input.name.trim(),
    featureKey: input.featureKey,
    type: input.type,
    expectedValue: input.expectedValue,
    importance: input.importance,
    weight: input.weight ?? null,
    configured: input.configured ?? true,
    position: input.position ?? 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    custom: input.custom,
  };
}

type LegacyMapping = {
  featureKey: string;
  type: RequirementType;
  expectedValue: RequirementValue;
  category: WishlistCategory;
  importance: Importance;
  name: string;
};

const LEGACY_MUST_MAP: Record<string, LegacyMapping> = {
  "3+ bedrooms": {
    featureKey: "beds",
    type: "min",
    expectedValue: 3,
    category: "bedrooms",
    importance: "must",
    name: "At least 3 bedrooms",
  },
  "2+ bathrooms": {
    featureKey: "baths",
    type: "min",
    expectedValue: 2,
    category: "bedrooms",
    importance: "must",
    name: "At least 2 bathrooms",
  },
  "Dedicated home office": {
    featureKey: "officeSpaces",
    type: "min",
    expectedValue: 1,
    category: "bedrooms",
    importance: "must",
    name: "A dedicated office space",
  },
  "2-car garage": {
    featureKey: "garageCars",
    type: "min",
    expectedValue: 2,
    category: "bedrooms",
    importance: "must",
    name: "Garage for 2 cars",
  },
  "Updated kitchen": {
    featureKey: "updatedKitchen",
    type: "yes",
    expectedValue: true,
    category: "kitchen",
    importance: "must",
    name: "Updated kitchen",
  },
  "Fenced backyard": {
    featureKey: "fencedYard",
    type: "yes",
    expectedValue: true,
    category: "outdoor",
    importance: "must",
    name: "Fenced backyard",
  },
  "Good school district": {
    featureKey: "goodSchools",
    type: "yes",
    expectedValue: true,
    category: "location",
    importance: "must",
    name: "Good school district",
  },
  "Central air": {
    featureKey: "centralAir",
    type: "yes",
    expectedValue: true,
    category: "condition",
    importance: "must",
    name: "Central air",
  },
  "Laundry room": {
    featureKey: "laundryRoom",
    type: "yes",
    expectedValue: true,
    category: "interior",
    importance: "must",
    name: "Separate laundry room",
  },
  "Walk-in closet": {
    featureKey: "walkInCloset",
    type: "yes",
    expectedValue: true,
    category: "interior",
    importance: "must",
    name: "Walk-in closet",
  },
  "Storage space": {
    featureKey: "storageSpace",
    type: "yes",
    expectedValue: true,
    category: "interior",
    importance: "must",
    name: "Ample storage",
  },
  "Pet-friendly yard": {
    featureKey: "petFriendlyYard",
    type: "yes",
    expectedValue: true,
    category: "outdoor",
    importance: "must",
    name: "Pet-friendly yard",
  },
};

const LEGACY_NICE_MAP: Record<string, LegacyMapping> = {
  Pool: {
    featureKey: "pool",
    type: "yes",
    expectedValue: true,
    category: "outdoor",
    importance: "nice",
    name: "Swimming pool",
  },
  "Gated community": {
    featureKey: "gated",
    type: "yes",
    expectedValue: true,
    category: "community",
    importance: "nice",
    name: "Gated community",
  },
  Fireplace: {
    featureKey: "fireplace",
    type: "yes",
    expectedValue: true,
    category: "interior",
    importance: "nice",
    name: "Fireplace",
  },
  "Water view": {
    featureKey: "waterView",
    type: "yes",
    expectedValue: true,
    category: "location",
    importance: "nice",
    name: "Water view",
  },
  "Outdoor kitchen": {
    featureKey: "outdoorKitchen",
    type: "yes",
    expectedValue: true,
    category: "outdoor",
    importance: "nice",
    name: "Outdoor kitchen",
  },
  "Smart home": {
    featureKey: "smartHome",
    type: "yes",
    expectedValue: true,
    category: "interior",
    importance: "nice",
    name: "Smart home features",
  },
  "Guest suite": {
    featureKey: "guestSuite",
    type: "yes",
    expectedValue: true,
    category: "bedrooms",
    importance: "nice",
    name: "Guest suite",
  },
  "EV charger": {
    featureKey: "evCharger",
    type: "yes",
    expectedValue: true,
    category: "community",
    importance: "nice",
    name: "EV charger",
  },
};

const BASE_REQUIREMENTS: Array<{
  name: string;
  category: WishlistCategory;
  featureKey: string;
  type: RequirementType;
  expectedValue: RequirementValue;
  importance: Importance;
  configured: boolean;
}> = [
  {
    name: "At least 3 bedrooms",
    category: "bedrooms",
    featureKey: "beds",
    type: "min",
    expectedValue: 3,
    importance: "must",
    configured: true,
  },
  {
    name: "A dedicated office space",
    category: "bedrooms",
    featureKey: "officeSpaces",
    type: "min",
    expectedValue: 1,
    importance: "must",
    configured: true,
  },
  {
    name: "At least 2 bathrooms",
    category: "bedrooms",
    featureKey: "baths",
    type: "min",
    expectedValue: 2,
    importance: "must",
    configured: true,
  },
  {
    name: "Updated kitchen",
    category: "kitchen",
    featureKey: "updatedKitchen",
    type: "yes",
    expectedValue: true,
    importance: "must",
    configured: true,
  },
  {
    name: "Fenced backyard",
    category: "outdoor",
    featureKey: "fencedYard",
    type: "yes",
    expectedValue: true,
    importance: "must",
    configured: true,
  },
  {
    name: "Move-in ready",
    category: "condition",
    featureKey: "moveInReady",
    type: "yes",
    expectedValue: true,
    importance: "must",
    configured: true,
  },
  {
    name: "Garage for 2 cars",
    category: "bedrooms",
    featureKey: "garageCars",
    type: "min",
    expectedValue: 2,
    importance: "nice",
    configured: true,
  },
  {
    name: "Swimming pool",
    category: "outdoor",
    featureKey: "pool",
    type: "yes",
    expectedValue: true,
    importance: "nice",
    configured: true,
  },
  {
    name: "Gated community",
    category: "community",
    featureKey: "gated",
    type: "yes",
    expectedValue: true,
    importance: "nice",
    configured: true,
  },
  {
    name: "Open floor plan",
    category: "interior",
    featureKey: "openFloorPlan",
    type: "yes",
    expectedValue: true,
    importance: "nice",
    configured: true,
  },
  {
    name: "No cities excluded yet",
    category: "location",
    featureKey: "excludedCity",
    type: "exclude",
    expectedValue: "",
    importance: "dealbreaker",
    configured: false,
  },
  {
    name: "Monthly ownership cost under target",
    category: "financial",
    featureKey: "monthlyOwnershipCost",
    type: "max",
    expectedValue: Math.round(DEFAULT_BUDGET_INPUTS.targetMonthly),
    importance: "nice",
    configured: false,
  },
  {
    name: "Purchase price within budget",
    category: "financial",
    featureKey: "price",
    type: "max",
    expectedValue: 1_500_000,
    importance: "nice",
    configured: false,
  },
];

function positionFor(category: WishlistCategory) {
  return CATEGORY_ORDER.indexOf(category);
}

const LEGACY_CATEGORY_MAP: Record<string, WishlistCategory> = {
  "Bedrooms & Workspaces": "bedrooms",
  "Interior & Layout": "interior",
  Kitchen: "kitchen",
  "Outdoor Space": "outdoor",
  "Community Amenities": "community",
  "Location & Neighborhood": "location",
  "Home Condition": "condition",
  "Financial Requirements": "financial",
};

export function defaultRequirements(wishlistId: string): WishlistRequirement[] {
  return BASE_REQUIREMENTS.map((requirement, index) =>
    createRequirement({
      ...requirement,
      id: `${wishlistId}-req-${index}`,
      wishlistId,
      position: positionFor(requirement.category) * 100 + index,
    }),
  );
}

/**
 * Import the original must-have / nice-to-have checklist into the new typed
 * model. Category suggestions (the old "All" tab) were ideas, not selected
 * preferences, so they are intentionally not scored.
 */
export function parseLegacyLabel(label: string): Partial<LegacyMapping> | null {
  const bedrooms = label.match(/^(\d+)\+?\s*(?:bedrooms?|beds?)\b/i);
  if (bedrooms) {
    return {
      featureKey: "beds",
      type: "min",
      expectedValue: Number(bedrooms[1]),
      category: "bedrooms",
      name: `At least ${bedrooms[1]} bedrooms`,
    };
  }
  const bathrooms = label.match(/^(\d+(?:\.\d+)?)\+?\s*(?:bathrooms?|baths?)\b/i);
  if (bathrooms) {
    return {
      featureKey: "baths",
      type: "min",
      expectedValue: Number(bathrooms[1]),
      category: "bedrooms",
      name: `At least ${bathrooms[1]} bathrooms`,
    };
  }
  const garage = label.match(/^(\d+)\s*[- ]?(?:car|cars)?\s*garage/i);
  if (garage) {
    return {
      featureKey: "garageCars",
      type: "min",
      expectedValue: Number(garage[1]),
      category: "bedrooms",
      name: `Garage for ${garage[1]} cars`,
    };
  }
  const offices = label.match(/^(\d+)\+?\s*(?:offices?|office spaces?)/i);
  if (offices) {
    return {
      featureKey: "officeSpaces",
      type: "min",
      expectedValue: Number(offices[1]),
      category: "bedrooms",
      name: `${offices[1]} office spaces`,
    };
  }
  return null;
}

/** Upgrade requirements imported by an earlier V2 build without touching custom user text. */
export function upgradeImportedRequirement(
  requirement: WishlistRequirement,
): WishlistRequirement {
  if (!requirement.id.includes("-legacy-")) return requirement;
  const parsed = parseLegacyLabel(requirement.name);
  if (!parsed) return requirement;
  return {
    ...requirement,
    featureKey: parsed.featureKey ?? requirement.featureKey,
    type: parsed.type ?? requirement.type,
    expectedValue: parsed.expectedValue ?? requirement.expectedValue,
    category: parsed.category ?? requirement.category,
    name: parsed.name ?? requirement.name,
    custom: false,
  };
}

export function requirementsFromLegacy(
  wishlistId: string,
  items: WishlistItem[],
): WishlistRequirement[] {
  const selected = items.filter(
    (item) => item.kind === "must" || item.kind === "nice",
  );
  if (selected.length === 0) return defaultRequirements(wishlistId);

  const requirements: WishlistRequirement[] = [];
  let index = 0;

  for (const item of selected) {
    const map =
      (item.kind === "must"
        ? LEGACY_MUST_MAP[item.label]
        : LEGACY_NICE_MAP[item.label]) ?? parseLegacyLabel(item.label) as
        | LegacyMapping
        | undefined;
    const fallbackCategory: WishlistCategory =
      item.kind === "must" ? "interior" : "outdoor";
    const category = map?.category ?? fallbackCategory;

    requirements.push(
      createRequirement({
        id: `${wishlistId}-legacy-${index}`,
        wishlistId,
        name: map?.name ?? item.label,
        category,
        featureKey: map?.featureKey ?? `custom:${slug(item.label)}`,
        type: map?.type ?? "yes",
        expectedValue: map?.expectedValue ?? true,
        importance: item.kind === "must" ? "must" : "nice",
        configured: item.done,
        position: positionFor(category) * 100 + index,
        custom: !map,
      }),
    );
    index += 1;
  }

  // The old "All" tab was a larger checklist of features the household cared
  // about. Bring the checked ones along for reference, but mark them "not
  // important" so they do not silently change the new weighted score. Users
  // can promote any of them to a must-have or nice-to-have.
  const usedNames = new Set(
    requirements.map((requirement) => requirement.name.trim().toLowerCase()),
  );
  for (const item of items) {
    if (item.kind !== "category" || !item.done) continue;
    if (usedNames.has(item.label.trim().toLowerCase())) continue;
    const category =
      LEGACY_CATEGORY_MAP[item.category ?? ""] ?? "interior";
    requirements.push(
      createRequirement({
        id: `${wishlistId}-category-${index}`,
        wishlistId,
        name: item.label,
        category,
        featureKey: `custom:${slug(item.label)}`,
        type: "yes",
        expectedValue: true,
        importance: "ignore",
        configured: true,
        position: positionFor(category) * 100 + index,
        custom: true,
      }),
    );
    usedNames.add(item.label.trim().toLowerCase());
    index += 1;
  }

  // Make sure the new financial and dealbreaker capabilities are discoverable
  // without forcing them into the score.
  const extras = BASE_REQUIREMENTS.filter(
    (requirement) =>
      (requirement.importance === "dealbreaker" || requirement.category === "financial") &&
      !requirements.some((entry) => entry.featureKey === requirement.featureKey),
  );
  for (const extra of extras) {
    requirements.push(
      createRequirement({
        ...extra,
        id: `${wishlistId}-extra-${index}`,
        wishlistId,
        configured: false,
        position: positionFor(extra.category) * 100 + index,
      }),
    );
    index += 1;
  }

  return requirements;
}

export function slug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "custom";
}

/**
 * Suggestions for a newly-created wishlist. They are deliberately
 * unconfigured and not important so they never affect scoring until the user
 * explicitly promotes them.
 */
export function suggestedRequirements(
  wishlistId: string,
): WishlistRequirement[] {
  return defaultRequirements(wishlistId).map((requirement, index) => ({
    ...requirement,
    id: `${wishlistId}-suggested-${index}`,
    configured: false,
    importance: "ignore",
  }));
}

export function duplicateWishlist(
  source: Wishlist,
  requirements: WishlistRequirement[],
  name: string,
): { wishlist: Wishlist; requirements: WishlistRequirement[] } {
  const wishlist = createWishlist(name, { active: false, budget: source.budget });
  const copies = sortRequirements(
    requirements.filter((requirement) => requirement.wishlistId === source.id),
  ).map((requirement, index) =>
    createRequirement({
      wishlistId: wishlist.id,
      name: requirement.name,
      category: requirement.category,
      featureKey: requirement.featureKey,
      type: requirement.type,
      expectedValue: requirement.expectedValue,
      importance: requirement.importance,
      weight: requirement.weight,
      configured: requirement.configured,
      position: index,
      custom: requirement.custom,
    }),
  );
  return { wishlist, requirements: copies };
}

export function sortRequirements(requirements: WishlistRequirement[]) {
  return [...requirements].sort((a, b) => {
    const categoryDiff =
      positionFor(a.category) - positionFor(b.category);
    if (categoryDiff !== 0) return categoryDiff;
    return a.position - b.position;
  });
}

export function groupByCategory(requirements: WishlistRequirement[]) {
  const groups = new Map<WishlistCategory, WishlistRequirement[]>();
  for (const category of CATEGORY_ORDER) groups.set(category, []);
  for (const requirement of sortRequirements(requirements)) {
    const list = groups.get(requirement.category) ?? [];
    list.push(requirement);
    groups.set(requirement.category, list);
  }
  return [...groups.entries()]
    .filter(([, items]) => items.length > 0)
    .map(([category, items]) => ({ category, items }));
}

export function wishlistSetupProgress(requirements: WishlistRequirement[]) {
  const total = requirements.length;
  const configured = requirements.filter(
    (requirement) => requirement.configured,
  ).length;
  return {
    configured,
    total,
    percent: total > 0 ? (configured / total) * 100 : 0,
  };
}

export function activeWishlist(wishlists: Wishlist[]): Wishlist | null {
  return wishlists.find((wishlist) => wishlist.isActive) ?? wishlists[0] ?? null;
}

export function requirementsFor(
  requirements: WishlistRequirement[],
  wishlistId: string | null,
) {
  if (!wishlistId) return [];
  return sortRequirements(
    requirements.filter((requirement) => requirement.wishlistId === wishlistId),
  );
}
