/**
 * V2 product types.
 *
 * These are deliberately kept separate from the legacy `types.ts` records so
 * the original Supabase tables (homes, wishlist_items, tour_notes,
 * budget_settings, comparison_notes) keep working untouched.
 */

export type LocaleCode = "en" | "es";

export type Importance = "must" | "nice" | "dealbreaker" | "ignore";

export type RequirementType =
  | "yes"
  | "min"
  | "max"
  | "range"
  | "text"
  | "exclude";

export type WishlistCategory =
  | "location"
  | "bedrooms"
  | "interior"
  | "kitchen"
  | "outdoor"
  | "community"
  | "condition"
  | "financial";

export type RequirementValue =
  | string
  | number
  | boolean
  | { min: number; max: number }
  | { values: string[] }
  | null;

export type WishlistRequirement = {
  id: string;
  wishlistId: string;
  category: WishlistCategory;
  name: string;
  /** Property fact this requirement is evaluated against. */
  featureKey: string;
  type: RequirementType;
  /** Expected value / condition, stored separately from importance. */
  expectedValue: RequirementValue;
  importance: Importance;
  /** Optional override. When null the default weight for the importance is used. */
  weight: number | null;
  /** False until the user has reviewed or edited the preference. */
  configured: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
  /** True when this is a user-defined requirement. */
  custom?: boolean;
};

export type Wishlist = {
  id: string;
  name: string;
  isActive: boolean;
  /** Optional purchase budget for this wishlist. */
  budget: number | null;
  createdAt: string;
  updatedAt: string;
};

export type FactValue = string | number | boolean | null;

export type PropertyFacts = Record<string, FactValue>;

export type TourStatus = "none" | "scheduled" | "toured" | "cancelled";

export type PropertyDetails = {
  homeId: string;
  /** Compressed data URL uploaded by the user. */
  photo: string | null;
  listingUrl: string;
  notes: string;
  favorite: boolean;
  /** Additional facts that do not fit the legacy homes columns. */
  facts: PropertyFacts;
  tourDate: string | null;
  tourStatus: TourStatus;
  updatedAt: string;
};

export type BudgetInputs = {
  price: number;
  downPercent: number;
  downAmount: number;
  rate: number;
  termYears: number;
  annualTaxes: number;
  annualInsurance: number;
  monthlyHoa: number;
  monthlyMaintenance: number;
  monthlyMortgageInsurance: number;
  monthlyFloodInsurance: number;
  monthlyOther: number;
  targetMonthly: number;
  closingCosts: number;
  inspection: number;
  appraisal: number;
  moving: number;
  initialRepairs: number;
};

export type BudgetScenario = {
  id: string;
  name: string;
  wishlistId: string | null;
  propertyId: string | null;
  inputs: BudgetInputs;
  updatedAt: string;
};

export type UserProfile = {
  id: string;
  name: string;
  preferredLanguage: LocaleCode;
  createdAt: string;
};

export const DEFAULT_OWNER_ID = "shared";

export const CATEGORY_ORDER: WishlistCategory[] = [
  "location",
  "bedrooms",
  "interior",
  "kitchen",
  "outdoor",
  "community",
  "condition",
  "financial",
];

export const IMPORTANCE_ORDER: Importance[] = [
  "must",
  "nice",
  "dealbreaker",
  "ignore",
];

export const REQUIREMENT_TYPES: RequirementType[] = [
  "yes",
  "min",
  "max",
  "range",
  "text",
  "exclude",
];

export const DEFAULT_WEIGHTS: Record<Importance, number> = {
  must: 5,
  nice: 2,
  dealbreaker: 0,
  ignore: 0,
};

export const DEFAULT_BUDGET_INPUTS: BudgetInputs = {
  price: 1_250_000,
  downPercent: 20,
  downAmount: 250_000,
  rate: 6.5,
  termYears: 30,
  annualTaxes: 9_000,
  annualInsurance: 3_000,
  monthlyHoa: 350,
  monthlyMaintenance: 135,
  monthlyMortgageInsurance: 0,
  monthlyFloodInsurance: 0,
  monthlyOther: 0,
  targetMonthly: 7_500,
  closingCosts: 18_000,
  inspection: 650,
  appraisal: 700,
  moving: 3_500,
  initialRepairs: 5_000,
};

export const EMPTY_PROPERTY_DETAILS: Omit<PropertyDetails, "homeId"> = {
  photo: null,
  listingUrl: "",
  notes: "",
  favorite: false,
  facts: {},
  tourDate: null,
  tourStatus: "none",
  updatedAt: "",
};

export type FeatureKind = "number" | "boolean" | "text";

export type CatalogFeature = {
  key: string;
  category: WishlistCategory;
  kind: FeatureKind;
  /** English label stored on seeded requirements; translated for display. */
  label: string;
};

/**
 * Facts the app can evaluate. Custom requirements may use any other key; a
 * property editor exposes every custom key used by the user's wishlists.
 */
export const FEATURE_CATALOG: CatalogFeature[] = [
  { key: "city", category: "location", kind: "text", label: "City" },
  { key: "neighborhood", category: "location", kind: "text", label: "Neighborhood" },
  { key: "excludedCity", category: "location", kind: "text", label: "Excluded city" },
  { key: "beds", category: "bedrooms", kind: "number", label: "Bedrooms" },
  { key: "baths", category: "bedrooms", kind: "number", label: "Bathrooms" },
  { key: "officeSpaces", category: "bedrooms", kind: "number", label: "Office spaces" },
  { key: "garageCars", category: "bedrooms", kind: "number", label: "Garage capacity" },
  { key: "sqft", category: "interior", kind: "number", label: "Square feet" },
  { key: "lotAcres", category: "interior", kind: "number", label: "Lot size (acres)" },
  { key: "stories", category: "interior", kind: "number", label: "Stories" },
  { key: "primarySuite", category: "interior", kind: "boolean", label: "Primary suite" },
  { key: "walkInCloset", category: "interior", kind: "boolean", label: "Walk-in closet" },
  { key: "laundryRoom", category: "interior", kind: "boolean", label: "Laundry room" },
  { key: "openFloorPlan", category: "interior", kind: "boolean", label: "Open floor plan" },
  { key: "updatedKitchen", category: "kitchen", kind: "boolean", label: "Updated kitchen" },
  { key: "kitchenIsland", category: "kitchen", kind: "boolean", label: "Kitchen island" },
  { key: "gasRange", category: "kitchen", kind: "boolean", label: "Gas range" },
  { key: "walkInPantry", category: "kitchen", kind: "boolean", label: "Walk-in pantry" },
  { key: "pool", category: "outdoor", kind: "boolean", label: "Swimming pool" },
  { key: "fencedYard", category: "outdoor", kind: "boolean", label: "Fenced yard" },
  { key: "coveredPatio", category: "outdoor", kind: "boolean", label: "Covered patio" },
  { key: "outdoorKitchen", category: "outdoor", kind: "boolean", label: "Outdoor kitchen" },
  { key: "gated", category: "community", kind: "boolean", label: "Gated community" },
  { key: "communityGym", category: "community", kind: "boolean", label: "Community gym" },
  { key: "playground", category: "community", kind: "boolean", label: "Playground" },
  { key: "clubhouse", category: "community", kind: "boolean", label: "Clubhouse" },
  { key: "yearBuilt", category: "condition", kind: "number", label: "Year built" },
  { key: "moveInReady", category: "condition", kind: "boolean", label: "Move-in ready" },
  { key: "newRoof", category: "condition", kind: "boolean", label: "New roof" },
  { key: "centralAir", category: "condition", kind: "boolean", label: "Central air" },
  { key: "noMajorRepairs", category: "condition", kind: "boolean", label: "No major repairs" },
  { key: "price", category: "financial", kind: "number", label: "Purchase price" },
  { key: "hoa", category: "financial", kind: "number", label: "Monthly HOA fee" },
  { key: "monthlyOwnershipCost", category: "financial", kind: "number", label: "Monthly ownership cost" },
  { key: "propertyType", category: "interior", kind: "text", label: "Property type" },
];

export const FEATURE_BY_KEY: Record<string, CatalogFeature> = Object.fromEntries(
  FEATURE_CATALOG.map((feature) => [feature.key, feature]),
);

export function isWishlistCategory(value: string): value is WishlistCategory {
  return (CATEGORY_ORDER as string[]).includes(value);
}

export function isImportance(value: string): value is Importance {
  return (IMPORTANCE_ORDER as string[]).includes(value);
}

export function isRequirementType(value: string): value is RequirementType {
  return (REQUIREMENT_TYPES as string[]).includes(value);
}
