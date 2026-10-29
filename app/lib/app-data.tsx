"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_BUDGET,
  DEFAULT_COMPARISON_NOTES,
  DEFAULT_HOMES,
  DEFAULT_TOUR_NOTES,
  DEFAULT_WISHLIST,
} from "./defaults";
import { budgetEstimateInfo, type BudgetEstimateInfo } from "./budget-estimate";
import { calculateBudget, inputsForProperty } from "./finance";
import { homePatchToRow, type Home } from "./homes";
import { factsFromHome } from "./property-facts";
import {
  buildEvaluationRows,
  evaluationId,
  evaluationProgress,
  manualEvaluationMap,
  type EvaluationRow,
} from "./evaluations";
import {
  scoreRequirements,
  type EvaluationState,
  type ScoreResult,
} from "./scoring";
import { hasSupabaseConfig, supabase } from "./supabase";
import type {
  BudgetSettings,
  ComparisonNote,
  TourNote,
  WishlistItem,
  WishlistKind,
} from "./types";
import {
  DEFAULT_BUDGET_INPUTS,
  DEFAULT_OWNER_ID,
  DEFAULT_WEIGHTS,
  type BudgetInputs,
  type BudgetScenario,
  type PropertyDetails,
  type PropertyEvaluation,
  type PropertyFacts,
  type RequirementValue,
  type TourStatus,
  type UserProfile,
  type Wishlist,
  type WishlistCategory,
  type WishlistRequirement,
} from "./v2-types";
import {
  activeWishlist as pickActiveWishlist,
  createRequirement,
  createWishlist,
  defaultRequirements,
  duplicateWishlist,
  nowIso,
  requirementsFor,
  requirementsFromLegacy,
  upgradeImportedRequirement,
  wishlistSetupProgress,
} from "./wishlists";
import { newId } from "./wishlists";

type Snapshot = {
  homes: Home[];
  /** Legacy checklist retained for migration and data safety. */
  wishlist: WishlistItem[];
  tourNotes: Record<string, TourNote>;
  budget: BudgetSettings;
  comparisonNotes: ComparisonNote[];
  // V2
  profile: UserProfile;
  wishlists: Wishlist[];
  requirements: WishlistRequirement[];
  details: Record<string, PropertyDetails>;
  scenarios: BudgetScenario[];
  evaluations: PropertyEvaluation[];
};

type SyncStatus = "loading" | "synced" | "local";

export type ScoredHome = {
  home: Home;
  facts: PropertyFacts;
  score: ScoreResult;
  monthlyCost: number | null;
  budgetEstimate: BudgetEstimateInfo;
};

export type EvaluationSummary = {
  home: Home;
  answered: number;
  unanswered: number;
  total: number;
  percent: number;
};

export type NewHomeInput = {
  address: string;
  city: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  lot?: string;
  lotAcres?: number | null;
  garage?: string;
  garageCars?: number | null;
  hoa?: number | null;
  pool?: boolean | null;
  gated?: boolean | null;
  yearBuilt?: number;
  type?: string;
  description?: string;
  features?: string[];
  listingUrl?: string;
  photo?: string | null;
  notes?: string;
  facts?: PropertyFacts;
};

export type HomeUpdate = Partial<
  Pick<
    Home,
    | "address"
    | "city"
    | "price"
    | "beds"
    | "baths"
    | "sqft"
    | "lot"
    | "garage"
    | "pool"
    | "gated"
    | "hoa"
    | "yearBuilt"
    | "type"
    | "description"
    | "features"
    | "saved"
    | "tourRequested"
  >
> & {
  listingUrl?: string;
  photo?: string | null;
  notes?: string;
  favorite?: boolean;
  facts?: PropertyFacts;
  tourDate?: string | null;
  tourStatus?: TourStatus;
};

type AppData = Snapshot & {
  ready: boolean;
  status: SyncStatus;
  configured: boolean;
  v2Synced: boolean;
  saving: boolean;
  topMatch: Home;
  savedCount: number;
  upcomingTours: number;
  strongMatches: number;
  wishlistDone: number;
  wishlistTotal: number;
  mustDone: number;
  mustTotal: number;
  activeWishlist: Wishlist | null;
  activeRequirements: WishlistRequirement[];
  wishlistProgress: { configured: number; total: number; percent: number };
  scoredHomes: ScoredHome[];
  topMatches: ScoredHome[];
  homesNeedingEvaluation: ScoredHome[];
  evaluations: PropertyEvaluation[];
  evaluationsSynced: boolean;
  evaluationSummaries: EvaluationSummary[];
  pendingEvaluations: EvaluationSummary[];
  nextEvaluationHome: Home | null;
  defaultScenario: BudgetScenario;
  activeScenario: BudgetScenario;
  getScoreForHome: (homeId: string) => ScoreResult | null;
  getFactsForHome: (homeId: string) => PropertyFacts | null;
  getEvaluationRows: (homeId: string, wishlistId: string) => EvaluationRow[];
  getMonthlyCostForHome: (homeId: string) => number | null;
  getBudgetEstimateForHome: (homeId: string) => BudgetEstimateInfo | null;
  getBudgetScenarioForProperty: (homeId: string) => BudgetScenario | null;
  setEvaluation: (
    homeId: string,
    wishlistId: string,
    requirementId: string,
    state: EvaluationState,
  ) => void;
  addHome: (input: NewHomeInput) => Home | null;
  updateHome: (
    homeId: string,
    patch: HomeUpdate,
  ) => Promise<{ home: boolean; details: boolean }>;
  removeHome: (homeId: string) => void;
  toggleSaved: (homeId: string) => void;
  setTourRequested: (homeId: string, value?: boolean) => void;
  toggleFavorite: (homeId: string) => void;
  toggleWishlistItem: (itemId: string) => void;
  addWishlistItem: (
    kind: WishlistKind,
    label: string,
    category?: string | null,
  ) => void;
  createWishlist: (
    name: string,
    budget?: number | null,
    makeActive?: boolean,
  ) => Wishlist | null;
  renameWishlist: (wishlistId: string, name: string) => void;
  duplicateWishlist: (wishlistId: string, name?: string) => Wishlist | null;
  deleteWishlist: (wishlistId: string) => boolean;
  setActiveWishlist: (wishlistId: string) => void;
  updateWishlistBudget: (wishlistId: string, budget: number | null) => void;
  addRequirement: (input: {
    wishlistId: string;
    name: string;
    category: WishlistCategory;
    featureKey: string;
    type: WishlistRequirement["type"];
    expectedValue: RequirementValue;
    importance: WishlistRequirement["importance"];
    weight?: number | null;
    configured?: boolean;
    custom?: boolean;
  }) => WishlistRequirement;
  updateRequirement: (
    requirementId: string,
    patch: Partial<WishlistRequirement>,
  ) => void;
  removeRequirement: (requirementId: string) => void;
  saveTourNote: (
    homeId: string,
    patch: Pick<TourNote, "rating" | "notes" | "pros" | "cons">,
  ) => void;
  updateBudget: (patch: Partial<BudgetSettings>) => void;
  addComparisonNote: (body: string) => void;
  saveScenarioInputs: (
    inputs: BudgetInputs,
    propertyId?: string | null,
    confirmed?: boolean,
  ) => BudgetScenario;
  updateScenarioInputs: (
    scenarioId: string,
    inputs: BudgetInputs,
    confirmed?: boolean,
  ) => void;
};

const STORAGE_KEY = "next-home-edit:data:v3";
const LEGACY_STORAGE_KEY = "next-home-edit:data:v2";

const AppDataContext = createContext<AppData | null>(null);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function downAmountFor(price: number, percent: number) {
  return Math.round(((price * percent) / 100) * 100) / 100;
}

/** Zero HOA can be known (explicitly recorded) or unknown (legacy blank). */
function hoaIsKnown(home: Home) {
  if (
    home.facts &&
    Object.prototype.hasOwnProperty.call(home.facts, "hoa")
  ) {
    return home.facts.hoa !== null && home.facts.hoa !== undefined;
  }
  return home.hoa > 0;
}

function seedV2(
  legacyWishlist: WishlistItem[],
  budget: BudgetSettings,
): Pick<
  Snapshot,
  "profile" | "wishlists" | "requirements" | "details" | "scenarios" | "evaluations"
> {
  const wishlist: Wishlist = {
    id: "wishlist-default",
    name: "Our Next Home",
    isActive: true,
    budget: null,
    createdAt: "",
    updatedAt: "",
  };
  const requirements =
    legacyWishlist.length > 0
      ? requirementsFromLegacy(wishlist.id, legacyWishlist)
      : defaultRequirements(wishlist.id);

  const scenario: BudgetScenario = {
    id: "scenario-default",
    name: "Baseline plan",
    wishlistId: wishlist.id,
    propertyId: null,
    inputs: {
      ...DEFAULT_BUDGET_INPUTS,
      price: budget.price > 0 ? budget.price : DEFAULT_BUDGET_INPUTS.price,
      downPercent: budget.downPercent,
      downAmount: downAmountFor(budget.price, budget.downPercent),
      rate: budget.rate,
      termYears: budget.term,
    },
    confirmed: false,
    updatedAt: "",
  };

  return {
    profile: {
      id: DEFAULT_OWNER_ID,
      name: "My household",
      preferredLanguage: "en",
      createdAt: "",
    },
    wishlists: [wishlist],
    requirements,
    details: {},
    scenarios: [scenario],
    evaluations: [],
  };
}

function defaultSnapshot(): Snapshot {
  const legacy: Omit<
    Snapshot,
    | "profile"
    | "wishlists"
    | "requirements"
    | "details"
    | "scenarios"
    | "evaluations"
  > = {
    homes: clone(DEFAULT_HOMES),
    wishlist: clone(DEFAULT_WISHLIST),
    tourNotes: clone(DEFAULT_TOUR_NOTES),
    budget: { ...DEFAULT_BUDGET },
    comparisonNotes: clone(DEFAULT_COMPARISON_NOTES),
  };
  return {
    ...legacy,
    ...seedV2(legacy.wishlist, legacy.budget),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeWishlist(value: unknown): Wishlist | null {
  if (!isObject(value) || typeof value.id !== "string") return null;
  return {
    id: value.id,
    name: typeof value.name === "string" && value.name.trim() ? value.name : "Our Next Home",
    isActive: Boolean(value.isActive),
    budget:
      typeof value.budget === "number" && Number.isFinite(value.budget)
        ? value.budget
        : null,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}

function normalizeRequirement(value: unknown): WishlistRequirement | null {
  if (!isObject(value) || typeof value.id !== "string") return null;
  if (typeof value.wishlistId !== "string" || typeof value.name !== "string") {
    return null;
  }
  const requirement: WishlistRequirement = {
    id: value.id,
    wishlistId: value.wishlistId,
    category: value.category as WishlistCategory,
    name: value.name,
    featureKey: typeof value.featureKey === "string" ? value.featureKey : "custom",
    type: value.type as WishlistRequirement["type"],
    expectedValue: (value.expectedValue ?? null) as RequirementValue,
    importance: value.importance as WishlistRequirement["importance"],
    weight:
      typeof value.weight === "number" && Number.isFinite(value.weight)
        ? value.weight
        : null,
    configured: value.configured !== false,
    position: typeof value.position === "number" ? value.position : 0,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
    custom: Boolean(value.custom),
  };
  return upgradeImportedRequirement(requirement);
}

function normalizeDetails(value: unknown): PropertyDetails | null {
  if (!isObject(value) || typeof value.homeId !== "string") return null;
  return {
    homeId: value.homeId,
    photo: typeof value.photo === "string" && value.photo ? value.photo : null,
    listingUrl: typeof value.listingUrl === "string" ? value.listingUrl : "",
    notes: typeof value.notes === "string" ? value.notes : "",
    favorite: Boolean(value.favorite),
    facts: isObject(value.facts) ? (value.facts as PropertyFacts) : {},
    tourDate: typeof value.tourDate === "string" ? value.tourDate : null,
    tourStatus: (typeof value.tourStatus === "string"
      ? value.tourStatus
      : "none") as TourStatus,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}

function normalizeScenario(value: unknown): BudgetScenario | null {
  if (!isObject(value) || typeof value.id !== "string") return null;
  return {
    id: value.id,
    name: typeof value.name === "string" ? value.name : "",
    wishlistId: typeof value.wishlistId === "string" ? value.wishlistId : null,
    propertyId: typeof value.propertyId === "string" ? value.propertyId : null,
    inputs: { ...DEFAULT_BUDGET_INPUTS, ...(isObject(value.inputs) ? value.inputs : {}) } as BudgetInputs,
    confirmed: value.confirmed === true,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}

function normalizeEvaluation(value: unknown): PropertyEvaluation | null {
  if (!isObject(value) || typeof value.id !== "string") return null;
  if (
    typeof value.homeId !== "string" ||
    typeof value.wishlistId !== "string" ||
    typeof value.requirementId !== "string"
  ) {
    return null;
  }
  if (value.state !== "met" && value.state !== "not-met") return null;
  return {
    id: value.id,
    homeId: value.homeId,
    wishlistId: value.wishlistId,
    requirementId: value.requirementId,
    state: value.state,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}

function localSnapshotFromParsed(parsed: Record<string, unknown>): Snapshot {
  const base = defaultSnapshot();
  const legacyWishlist =
    Array.isArray(parsed.wishlist) && parsed.wishlist.length > 0
      ? (parsed.wishlist as WishlistItem[])
      : base.wishlist;
  const budget = isObject(parsed.budget)
    ? { ...base.budget, ...(parsed.budget as Partial<BudgetSettings>) }
    : base.budget;

  const seeded = seedV2(legacyWishlist, budget);
  const wishlistsRaw = Array.isArray(parsed.wishlists)
    ? parsed.wishlists.map(normalizeWishlist).filter((entry): entry is Wishlist => Boolean(entry))
    : [];
  const requirementRaw = Array.isArray(parsed.requirements)
    ? parsed.requirements
        .map(normalizeRequirement)
        .filter((entry): entry is WishlistRequirement => Boolean(entry))
    : [];
  const detailsEntry = isObject(parsed.details)
    ? Object.values(parsed.details)
        .map(normalizeDetails)
        .filter((entry): entry is PropertyDetails => Boolean(entry))
    : [];
  const scenariosRaw = Array.isArray(parsed.scenarios)
    ? parsed.scenarios
        .map(normalizeScenario)
        .filter((entry): entry is BudgetScenario => Boolean(entry))
    : [];
  const evaluationsRaw = Array.isArray(parsed.evaluations)
    ? parsed.evaluations
        .map(normalizeEvaluation)
        .filter((entry): entry is PropertyEvaluation => Boolean(entry))
    : [];

  const wishlists = wishlistsRaw.length > 0 ? wishlistsRaw : seeded.wishlists;
  const activeId = wishlists.find((wishlist) => wishlist.isActive)?.id ?? wishlists[0]?.id;
  const normalizedWishlists = wishlists.map((wishlist) => ({
    ...wishlist,
    isActive: wishlist.id === activeId,
  }));

  return {
    homes: Array.isArray(parsed.homes) ? (parsed.homes as Home[]) : base.homes,
    wishlist: legacyWishlist,
    tourNotes: isObject(parsed.tourNotes)
      ? (parsed.tourNotes as Record<string, TourNote>)
      : base.tourNotes,
    budget,
    comparisonNotes: Array.isArray(parsed.comparisonNotes)
      ? (parsed.comparisonNotes as ComparisonNote[])
      : [],
    profile: isObject(parsed.profile)
      ? {
          ...seeded.profile,
          ...(parsed.profile as Partial<UserProfile>),
        }
      : seeded.profile,
    wishlists: normalizedWishlists,
    requirements: Array.isArray(parsed.requirements)
      ? requirementRaw
      : requirementsFromLegacy(normalizedWishlists[0].id, legacyWishlist),
    details: Object.fromEntries(detailsEntry.map((entry) => [entry.homeId, entry])),
    scenarios: scenariosRaw.length > 0 ? scenariosRaw : seeded.scenarios,
    evaluations: evaluationsRaw,
  };
}

function readStored(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isObject(parsed)) return null;
    return localSnapshotFromParsed(parsed);
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Database row shapes                                                        */
/* -------------------------------------------------------------------------- */

type HomeRow = {
  id: string;
  address: string;
  city: string;
  price: number | string;
  match: number | string;
  beds: number | string;
  baths: number | string;
  sqft: number | string;
  lot: string;
  garage: string;
  pool: boolean;
  gated: boolean;
  hoa: number | string;
  year_built: number | string;
  type: string;
  days_on_market: number | string;
  image_filter: string;
  description: string;
  features: string[] | null;
  saved: boolean;
  tour_requested: boolean;
  position: number | string;
};

type WishlistRow = {
  id: string;
  kind: WishlistKind;
  category: string | null;
  label: string;
  done: boolean;
  position: number | string;
};

type TourNoteRow = {
  home_id: string;
  rating: number | string;
  notes: string | null;
  pros: string[] | null;
  cons: string[] | null;
  updated_at: string | null;
};

type BudgetRow = {
  id: number | string;
  price: number | string;
  down_percent: number | string;
  term: number | string;
  rate: number | string;
};

type ComparisonRow = {
  id: string;
  body: string;
  created_at: string;
};

type WishlistV2Row = {
  id: string;
  owner_id: string;
  name: string;
  is_active: boolean;
  budget: number | string | null;
  created_at: string | null;
  updated_at: string | null;
};

type RequirementV2Row = {
  id: string;
  wishlist_id: string;
  owner_id: string;
  category: string;
  name: string;
  feature_key: string;
  requirement_type: string;
  expected_value: unknown;
  importance: string;
  weight: number | string | null;
  configured: boolean;
  position: number | string;
  custom: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type DetailsRow = {
  home_id: string;
  owner_id: string;
  photo: string | null;
  listing_url: string;
  notes: string;
  favorite: boolean;
  facts: unknown;
  tour_date: string | null;
  tour_status: string;
  updated_at: string | null;
};

type ScenarioRow = {
  id: string;
  owner_id: string;
  wishlist_id: string | null;
  property_id: string | null;
  name: string;
  inputs: unknown;
  confirmed: boolean | null;
  updated_at: string | null;
};

type EvaluationV2Row = {
  id: string;
  owner_id: string;
  home_id: string;
  wishlist_id: string;
  requirement_id: string;
  state: string;
  created_at: string | null;
  updated_at: string | null;
};

function mapHomeRow(row: HomeRow): Home {
  return {
    id: row.id,
    address: row.address,
    city: row.city,
    price: Number(row.price),
    match: Number(row.match),
    beds: Number(row.beds),
    baths: Number(row.baths),
    sqft: Number(row.sqft),
    lot: row.lot,
    garage: row.garage,
    pool: row.pool,
    gated: row.gated,
    hoa: Number(row.hoa),
    yearBuilt: Number(row.year_built),
    type: row.type,
    daysOnMarket: Number(row.days_on_market),
    imageFilter: row.image_filter,
    description: row.description,
    features: row.features ?? [],
    saved: row.saved,
    tourRequested: row.tour_requested,
  };
}

function toHomeRow(home: Home, position: number) {
  return {
    id: home.id,
    address: home.address,
    city: home.city,
    price: home.price,
    match: home.match,
    beds: home.beds,
    baths: home.baths,
    sqft: home.sqft,
    lot: home.lot,
    garage: home.garage,
    pool: home.pool,
    gated: home.gated,
    hoa: home.hoa,
    year_built: home.yearBuilt,
    type: home.type,
    days_on_market: home.daysOnMarket,
    image_filter: home.imageFilter,
    description: home.description,
    features: home.features,
    saved: home.saved,
    tour_requested: home.tourRequested,
    position,
  };
}

function mapWishlistRow(row: WishlistRow): WishlistItem {
  return {
    id: row.id,
    kind: row.kind,
    category: row.category,
    label: row.label,
    done: row.done,
    position: Number(row.position),
  };
}

function toWishlistRow(item: WishlistItem) {
  return {
    id: item.id,
    kind: item.kind,
    category: item.category,
    label: item.label,
    done: item.done,
    position: item.position,
  };
}

function mapTourNoteRow(row: TourNoteRow): TourNote {
  return {
    homeId: row.home_id,
    rating: Number(row.rating),
    notes: row.notes ?? "",
    pros: row.pros ?? [],
    cons: row.cons ?? [],
    updatedAt: row.updated_at ?? "",
  };
}

function toTourNoteRow(note: TourNote) {
  return {
    home_id: note.homeId,
    rating: note.rating,
    notes: note.notes,
    pros: note.pros,
    cons: note.cons,
    updated_at: note.updatedAt || new Date().toISOString(),
  };
}

function mapBudgetRow(row: BudgetRow): BudgetSettings {
  return {
    price: Number(row.price),
    downPercent: Number(row.down_percent),
    term: Number(row.term),
    rate: Number(row.rate),
  };
}

function toBudgetRow(budget: BudgetSettings) {
  return {
    id: 1,
    price: budget.price,
    down_percent: budget.downPercent,
    term: budget.term,
    rate: budget.rate,
    updated_at: new Date().toISOString(),
  };
}

function mapComparisonRow(row: ComparisonRow): ComparisonNote {
  return { id: row.id, body: row.body, createdAt: row.created_at };
}

function mapWishlistV2Row(row: WishlistV2Row): Wishlist {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    budget:
      row.budget === null || row.budget === undefined ? null : Number(row.budget),
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

function toWishlistV2Row(wishlist: Wishlist, ownerId: string) {
  return {
    id: wishlist.id,
    owner_id: ownerId,
    name: wishlist.name,
    is_active: wishlist.isActive,
    budget: wishlist.budget,
    created_at: wishlist.createdAt || new Date().toISOString(),
    updated_at: wishlist.updatedAt || new Date().toISOString(),
  };
}

function mapRequirementV2Row(row: RequirementV2Row): WishlistRequirement {
  return {
    id: row.id,
    wishlistId: row.wishlist_id,
    category: row.category as WishlistCategory,
    name: row.name,
    featureKey: row.feature_key,
    type: row.requirement_type as WishlistRequirement["type"],
    expectedValue: (row.expected_value ?? null) as RequirementValue,
    importance: row.importance as WishlistRequirement["importance"],
    weight: row.weight === null || row.weight === undefined ? null : Number(row.weight),
    configured: row.configured,
    position: Number(row.position),
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
    custom: row.custom,
  };
}

function toRequirementV2Row(requirement: WishlistRequirement, ownerId: string) {
  return {
    id: requirement.id,
    wishlist_id: requirement.wishlistId,
    owner_id: ownerId,
    category: requirement.category,
    name: requirement.name,
    feature_key: requirement.featureKey,
    requirement_type: requirement.type,
    expected_value: requirement.expectedValue,
    importance: requirement.importance,
    weight: requirement.weight,
    configured: requirement.configured,
    position: requirement.position,
    custom: Boolean(requirement.custom),
    created_at: requirement.createdAt || new Date().toISOString(),
    updated_at: requirement.updatedAt || new Date().toISOString(),
  };
}

function mapDetailsRow(row: DetailsRow): PropertyDetails {
  return {
    homeId: row.home_id,
    photo: row.photo || null,
    listingUrl: row.listing_url ?? "",
    notes: row.notes ?? "",
    favorite: Boolean(row.favorite),
    facts: isObject(row.facts) ? (row.facts as PropertyFacts) : {},
    tourDate: row.tour_date ?? null,
    tourStatus: (row.tour_status ?? "none") as TourStatus,
    updatedAt: row.updated_at ?? "",
  };
}

function toDetailsRow(details: PropertyDetails, ownerId: string) {
  return {
    home_id: details.homeId,
    owner_id: ownerId,
    photo: details.photo,
    listing_url: details.listingUrl,
    notes: details.notes,
    favorite: details.favorite,
    facts: details.facts,
    tour_date: details.tourDate || null,
    tour_status: details.tourStatus,
    updated_at: details.updatedAt || new Date().toISOString(),
  };
}

function mapScenarioRow(row: ScenarioRow): BudgetScenario {
  return {
    id: row.id,
    name: row.name,
    wishlistId: row.wishlist_id,
    propertyId: row.property_id,
    inputs: {
      ...DEFAULT_BUDGET_INPUTS,
      ...(isObject(row.inputs) ? row.inputs : {}),
    } as BudgetInputs,
    confirmed: row.confirmed === true,
    updatedAt: row.updated_at ?? "",
  };
}

function toScenarioRow(scenario: BudgetScenario, ownerId: string) {
  return {
    id: scenario.id,
    owner_id: ownerId,
    wishlist_id: scenario.wishlistId,
    property_id: scenario.propertyId,
    name: scenario.name,
    inputs: scenario.inputs,
    confirmed: scenario.confirmed,
    updated_at: scenario.updatedAt || new Date().toISOString(),
  };
}

function mapEvaluationRow(row: EvaluationV2Row): PropertyEvaluation {
  return {
    id: row.id,
    homeId: row.home_id,
    wishlistId: row.wishlist_id,
    requirementId: row.requirement_id,
    state: row.state === "not-met" ? "not-met" : "met",
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

function toEvaluationRow(evaluation: PropertyEvaluation, ownerId: string) {
  return {
    id: evaluation.id,
    owner_id: ownerId,
    home_id: evaluation.homeId,
    wishlist_id: evaluation.wishlistId,
    requirement_id: evaluation.requirementId,
    state: evaluation.state,
    created_at: evaluation.createdAt || new Date().toISOString(),
    updated_at: evaluation.updatedAt || new Date().toISOString(),
  };
}

function mergeDetails(home: Home, details: PropertyDetails | undefined): Home {
  if (!details) {
    return {
      ...home,
      photo: home.photo ?? null,
      listingUrl: home.listingUrl ?? "",
      notes: home.notes ?? "",
      favorite: home.favorite ?? false,
      facts: home.facts ?? {},
      tourDate: home.tourDate ?? null,
      tourStatus: home.tourStatus ?? "none",
    };
  }
  return {
    ...home,
    photo: details.photo,
    listingUrl: details.listingUrl,
    notes: details.notes,
    favorite: details.favorite,
    facts: { ...(home.facts ?? {}), ...details.facts },
    tourDate: details.tourDate,
    tourStatus: details.tourStatus,
  };
}

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Snapshot>(defaultSnapshot);
  const [status, setStatus] = useState<SyncStatus>("loading");
  const [v2Synced, setV2Synced] = useState(false);
  const [evaluationsSynced, setEvaluationsSynced] = useState(false);
  const [pendingWrites, setPendingWrites] = useState(0);
  const [ready, setReady] = useState(false);
  const budgetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ownerId = data.profile.id || DEFAULT_OWNER_ID;

  useEffect(() => {
    let cancelled = false;
    const client = supabase;

    async function load() {
      if (!client) {
        const stored = readStored();
        if (cancelled) return;
        if (stored) setData(stored);
        setStatus("local");
        setReady(true);
        return;
      }

      try {
        const [
          homesResult,
          wishlistResult,
          notesResult,
          budgetResult,
          comparisonResult,
        ] = await Promise.all([
          client.from("homes").select("*").order("position", { ascending: true }),
          client
            .from("wishlist_items")
            .select("*")
            .order("position", { ascending: true }),
          client.from("tour_notes").select("*"),
          client.from("budget_settings").select("*").eq("id", 1).maybeSingle(),
          client
            .from("comparison_notes")
            .select("*")
            .order("created_at", { ascending: true }),
        ]);

        const failed = [
          homesResult,
          wishlistResult,
          notesResult,
          budgetResult,
          comparisonResult,
        ].find((result) => result.error);
        if (failed?.error) throw failed.error;
        if (cancelled) return;

        const legacy: Snapshot = {
          homes: ((homesResult.data ?? []) as HomeRow[]).map(mapHomeRow),
          wishlist: ((wishlistResult.data ?? []) as WishlistRow[]).map(
            mapWishlistRow,
          ),
          tourNotes: Object.fromEntries(
            ((notesResult.data ?? []) as TourNoteRow[]).map((row) => [
              row.home_id,
              mapTourNoteRow(row),
            ]),
          ),
          budget: budgetResult.data
            ? mapBudgetRow(budgetResult.data as BudgetRow)
            : { ...DEFAULT_BUDGET },
          comparisonNotes: ((comparisonResult.data ?? []) as ComparisonRow[]).map(
            mapComparisonRow,
          ),
          ...seedV2(
            ((wishlistResult.data ?? []) as WishlistRow[]).map(mapWishlistRow),
            budgetResult.data
              ? mapBudgetRow(budgetResult.data as BudgetRow)
              : { ...DEFAULT_BUDGET },
          ),
        };

        // First-run seed: keep the demo content when a table is still empty.
        if (legacy.homes.length === 0) {
          legacy.homes = clone(DEFAULT_HOMES);
          await client
            .from("homes")
            .upsert(legacy.homes.map(toHomeRow), { onConflict: "id" });
        }

        if (legacy.wishlist.length === 0) {
          legacy.wishlist = clone(DEFAULT_WISHLIST);
          await client
            .from("wishlist_items")
            .upsert(legacy.wishlist.map(toWishlistRow), { onConflict: "id" });
        }

        if (Object.keys(legacy.tourNotes).length === 0) {
          // Demo notes reference demo homes. Only seed notes for homes that
          // actually exist in this dataset, otherwise the foreign key rejects
          // the whole batch.
          legacy.tourNotes = Object.fromEntries(
            Object.entries(clone(DEFAULT_TOUR_NOTES)).filter(([homeId]) =>
              legacy.homes.some((home) => home.id === homeId),
            ),
          );
          if (Object.keys(legacy.tourNotes).length > 0) {
            await client
              .from("tour_notes")
              .upsert(Object.values(legacy.tourNotes).map(toTourNoteRow), {
                onConflict: "home_id",
              });
          }
        }

        if (!budgetResult.data) {
          await client
            .from("budget_settings")
            .upsert(toBudgetRow(legacy.budget), { onConflict: "id" });
        }

        // V2 tables are additive. If the migration has not been run, the app
        // keeps the V2 state on this device instead of failing the whole load.
        let next = legacy;
        let schemaReady = true;
        try {
          const [wishlistsResult, requirementsResult, detailsResult, scenariosResult] =
            await Promise.all([
              client
                .from("wishlists")
                .select("*")
                .eq("owner_id", DEFAULT_OWNER_ID)
                .order("created_at", { ascending: true }),
              client
                .from("wishlist_requirements")
                .select("*")
                .eq("owner_id", DEFAULT_OWNER_ID)
                .order("position", { ascending: true }),
              client
                .from("property_details")
                .select("*")
                .eq("owner_id", DEFAULT_OWNER_ID),
              client
                .from("budget_scenarios")
                .select("*")
                .eq("owner_id", DEFAULT_OWNER_ID)
                .order("updated_at", { ascending: true }),
            ]);

          const v2Error = [
            wishlistsResult,
            requirementsResult,
            detailsResult,
            scenariosResult,
          ].find((result) => result.error);
          if (v2Error?.error) throw v2Error.error;

          const wishlists = ((wishlistsResult.data ?? []) as WishlistV2Row[]).map(
            mapWishlistV2Row,
          );
          const requirements = (
            (requirementsResult.data ?? []) as RequirementV2Row[]
          ).map(mapRequirementV2Row);
          const details = Object.fromEntries(
            ((detailsResult.data ?? []) as DetailsRow[]).map((row) => [
              row.home_id,
              mapDetailsRow(row),
            ]),
          );
          const scenarios = ((scenariosResult.data ?? []) as ScenarioRow[]).map(
            mapScenarioRow,
          );

          if (wishlists.length === 0) {
            const seeded = seedV2(legacy.wishlist, legacy.budget);
            next = {
              ...legacy,
              ...seeded,
            };
            await client.from("profiles").upsert({
              id: DEFAULT_OWNER_ID,
              name: seeded.profile.name,
              preferred_language: seeded.profile.preferredLanguage,
            });
            await client
              .from("wishlists")
              .upsert(
                seeded.wishlists.map((wishlist) =>
                  toWishlistV2Row(wishlist, DEFAULT_OWNER_ID),
                ),
                { onConflict: "id" },
              );
            await client
              .from("wishlist_requirements")
              .upsert(
                seeded.requirements.map((requirement) =>
                  toRequirementV2Row(requirement, DEFAULT_OWNER_ID),
                ),
                { onConflict: "id" },
              );
            await client
              .from("budget_scenarios")
              .upsert(
                seeded.scenarios.map((scenario) =>
                  toScenarioRow(scenario, DEFAULT_OWNER_ID),
                ),
                { onConflict: "id" },
              );
          } else {
            const activeId =
              wishlists.find((wishlist) => wishlist.isActive)?.id ??
              wishlists[0]?.id;
            next = {
              ...legacy,
              wishlists: wishlists.map((wishlist) => ({
                ...wishlist,
                isActive: wishlist.id === activeId,
              })),
              requirements,
              details,
              scenarios:
                scenarios.length > 0
                  ? scenarios
                  : seedV2(legacy.wishlist, legacy.budget).scenarios,
            };
          }
        } catch (error) {
          schemaReady = false;
          const stored = readStored();
          if (stored) {
            next = {
              ...legacy,
              profile: stored.profile,
              wishlists: stored.wishlists,
              requirements: stored.requirements,
              details: stored.details,
              scenarios: stored.scenarios,
            };
          }
          console.warn(
            "V2 tables unavailable — run supabase/migrations/0002_v2.sql to sync wishlists, photos and scenarios.",
            error,
          );
        }

        // Evaluations are additive too. A missing evaluation table must not
        // take down wishlists or property details that already sync.
        let evaluations = next.evaluations ?? [];
        let evaluationsReady = false;
        try {
          const evaluationsResult = await client
            .from("property_evaluations")
            .select("*")
            .eq("owner_id", DEFAULT_OWNER_ID);
          if (evaluationsResult.error) throw evaluationsResult.error;
          evaluations = ((evaluationsResult.data ?? []) as EvaluationV2Row[]).map(
            mapEvaluationRow,
          );
          evaluationsReady = true;
        } catch (error) {
          const stored = readStored();
          if (stored) evaluations = stored.evaluations;
          console.warn(
            "Evaluation table unavailable — run supabase/migrations/0003_evaluations.sql to sync manual evaluations.",
            error,
          );
        }

        if (cancelled) return;
        // Details live in their own V2 table, so merge them into the homes the
        // UI reads. Local snapshots already contain merged homes; merging again
        // is harmless and keeps both paths consistent.
        next = {
          ...next,
          homes: next.homes.map((home) =>
            mergeDetails(home, next.details[home.id]),
          ),
        };
        setV2Synced(schemaReady);
        setEvaluationsSynced(evaluationsReady);
        setData({ ...next, evaluations });
        setStatus("synced");
      } catch (error) {
        if (cancelled) return;
        console.warn(
          "Supabase unavailable — saving to this device instead.",
          error,
        );
        const stored = readStored();
        if (stored) setData(stored);
        setStatus("local");
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Local mirror keeps device-only mode working across reloads, and protects
  // V2 data when the optional V2 tables have not been created yet.
  useEffect(() => {
    if (!ready) return;
    if (status !== "local" && v2Synced && evaluationsSynced) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage can be full or blocked; the in-memory state still works.
    }
  }, [data, ready, status, v2Synced, evaluationsSynced]);

  const pushMutation = useCallback(
    (run: () => PromiseLike<{ error: { message: string } | null }>) => {
      if (!hasSupabaseConfig || status !== "synced") return;
      setPendingWrites((count) => count + 1);
      void (async () => {
        try {
          const { error } = await run();
          if (error) {
            console.warn("Supabase write failed:", error.message);
            setStatus("local");
          }
        } catch (error) {
          console.warn("Supabase write failed:", error);
          setStatus("local");
        } finally {
          setPendingWrites((count) => Math.max(0, count - 1));
        }
      })();
    },
    [status],
  );

  const pushV2 = useCallback(
    (run: () => PromiseLike<{ error: { message: string } | null }>) => {
      if (!v2Synced) return;
      pushMutation(run);
    },
    [v2Synced, pushMutation],
  );

  const pushEvaluation = useCallback(
    (run: () => PromiseLike<{ error: { message: string } | null }>) => {
      if (!evaluationsSynced) return;
      pushMutation(run);
    },
    [evaluationsSynced, pushMutation],
  );

  const addHome = useCallback(
    (input: NewHomeInput): Home | null => {
      const address = input.address.trim();
      if (!address) return null;
      const duplicate = data.homes.some(
        (home) => home.address.trim().toLowerCase() === address.toLowerCase(),
      );
      if (duplicate) return null;

      const yearBuilt = Number(input.yearBuilt);
      const facts: PropertyFacts = {
        ...(input.facts ?? {}),
        pool: input.pool ?? null,
        gated: input.gated ?? null,
      };
      if (input.garageCars !== undefined && input.garageCars !== null) {
        facts.garageCars = input.garageCars;
      }
      if (input.hoa !== undefined && input.hoa !== null) {
        facts.hoa = input.hoa;
      }
      if (input.lotAcres !== undefined && input.lotAcres !== null) {
        facts.lotAcres = input.lotAcres;
      }

      const home: Home = {
        id: newId("home"),
        address,
        city: input.city.trim(),
        price: Number.isFinite(input.price) ? Math.max(0, input.price) : 0,
        match: 0,
        beds: Number.isFinite(input.beds) ? Math.max(0, input.beds) : 0,
        baths: Number.isFinite(input.baths) ? Math.max(0, input.baths) : 0,
        sqft: Number.isFinite(input.sqft) ? Math.max(0, input.sqft) : 0,
        lot: input.lot?.trim() ?? "",
        garage: input.garage?.trim() ?? "",
        pool: input.pool === true,
        gated: input.gated === true,
        hoa: input.hoa && input.hoa > 0 ? input.hoa : 0,
        yearBuilt: Number.isFinite(yearBuilt)
          ? Math.max(0, Math.round(yearBuilt))
          : 0,
        type: input.type?.trim() || "Single family",
        daysOnMarket: 0,
        imageFilter: "none",
        description: input.description?.trim() ?? "",
        features: input.features ?? [],
        saved: true,
        tourRequested: false,
        photo: input.photo ?? null,
        listingUrl: input.listingUrl?.trim() ?? "",
        notes: input.notes?.trim() ?? "",
        favorite: false,
        facts,
        tourDate: null,
        tourStatus: "none",
      };

      const details: PropertyDetails = {
        homeId: home.id,
        photo: home.photo ?? null,
        listingUrl: home.listingUrl ?? "",
        notes: home.notes ?? "",
        favorite: false,
        facts,
        tourDate: null,
        tourStatus: "none",
        updatedAt: nowIso(),
      };

      setData((current) => ({
        ...current,
        homes: [...current.homes, home],
        details: { ...current.details, [home.id]: details },
      }));
      pushMutation(() =>
        supabase!
          .from("homes")
          .insert(toHomeRow(home, data.homes.length)),
      );
      // Facts (including "unknown" pool/gated choices) live in the V2 details
      // record. pushV2 is a no-op until the migration has been run.
      pushV2(() =>
        supabase!
          .from("property_details")
          .upsert(toDetailsRow(details, ownerId), { onConflict: "home_id" }),
      );

      return home;
    },
    [data.homes, ownerId, pushMutation, pushV2],
  );

  const updateHome = useCallback(
    async (
      homeId: string,
      patch: HomeUpdate,
    ): Promise<{ home: boolean; details: boolean }> => {
      const coreKeys: (keyof Home)[] = [
        "address",
        "city",
        "price",
        "beds",
        "baths",
        "sqft",
        "lot",
        "garage",
        "pool",
        "gated",
        "hoa",
        "yearBuilt",
        "type",
        "description",
        "features",
        "saved",
        "tourRequested",
      ];
      const corePatch: Record<string, unknown> = {};
      for (const key of coreKeys) {
        if (key in patch) corePatch[key] = patch[key as keyof HomeUpdate];
      }

      const detailPatch = {
        listingUrl: patch.listingUrl,
        photo: patch.photo,
        notes: patch.notes,
        favorite: patch.favorite,
        facts: patch.facts,
        tourDate: patch.tourDate,
        tourStatus: patch.tourStatus,
      };
      const hasDetailPatch = Object.values(detailPatch).some(
        (value) => value !== undefined,
      );

      const currentHome = data.homes.find((home) => home.id === homeId);
      const nextHome = currentHome
        ? ({ ...currentHome, ...corePatch } as Home)
        : null;
      let nextDetails: PropertyDetails | null = null;
      if (hasDetailPatch) {
        const existing = data.details[homeId];
        const baseDetails: PropertyDetails = existing ?? {
          homeId,
          photo: null,
          listingUrl: "",
          notes: "",
          favorite: false,
          facts: {},
          tourDate: null,
          tourStatus: "none",
          updatedAt: "",
        };
        nextDetails = {
          ...baseDetails,
          ...(detailPatch.listingUrl !== undefined
            ? { listingUrl: detailPatch.listingUrl }
            : {}),
          ...(detailPatch.photo !== undefined ? { photo: detailPatch.photo } : {}),
          ...(detailPatch.notes !== undefined ? { notes: detailPatch.notes } : {}),
          ...(detailPatch.favorite !== undefined
            ? { favorite: detailPatch.favorite }
            : {}),
          ...(detailPatch.facts !== undefined
            ? { facts: { ...baseDetails.facts, ...detailPatch.facts } }
            : {}),
          ...(detailPatch.tourDate !== undefined
            ? { tourDate: detailPatch.tourDate }
            : {}),
          ...(detailPatch.tourStatus !== undefined
            ? { tourStatus: detailPatch.tourStatus }
            : {}),
          updatedAt: nowIso(),
        };
      }

      setData((current) => {
        const homes = current.homes.map((home) => {
          if (home.id !== homeId) return home;
          const merged = { ...home, ...corePatch } as Home;
          return nextDetails ? mergeDetails(merged, nextDetails) : merged;
        });

        return {
          ...current,
          homes,
          details: nextDetails
            ? { ...current.details, [homeId]: nextDetails }
            : current.details,
        };
      });

      let homeSynced = false;
      let detailsSynced = false;

      if (hasSupabaseConfig) {
        // Attempt the cloud write even if the last read fell back to local.
        // A transient outage should not force every future edit to stay on
        // this device forever. Failures are reported to the caller.
        // The listing write and the optional V2 details write are independent.
        // A missing V2 table must not make a successful price/bedroom update
        // look like it failed.
        try {
          if (Object.keys(corePatch).length > 0) {
            const updateResult = await supabase!
              .from("homes")
              .update(homePatchToRow(corePatch))
              .eq("id", homeId)
              .select("id");
            if (updateResult.error) throw updateResult.error;
            if (updateResult.data && updateResult.data.length > 0) {
              homeSynced = true;
            } else if (nextHome && homeId.startsWith("home-")) {
              // A locally-created home can be edited before its original insert
              // completes. Upsert it so the edit reaches the shared dataset.
              const position = data.homes.findIndex((home) => home.id === homeId);
              const upsertResult = await supabase!
                .from("homes")
                .upsert(toHomeRow(nextHome, Math.max(0, position)), {
                  onConflict: "id",
                });
              if (upsertResult.error) throw upsertResult.error;
              homeSynced = true;
            } else {
              // The row is not in the shared dataset. Do not silently claim a
              // successful cloud save; the caller shows a device-only result.
              homeSynced = false;
            }
          } else {
            homeSynced = true;
          }
        } catch (error) {
          console.warn("Supabase home write failed:", error);
          setStatus("local");
          homeSynced = false;
        }

        if (!nextDetails) {
          detailsSynced = true;
        } else if (v2Synced) {
          try {
            const detailsResult = await supabase!
              .from("property_details")
              .upsert(toDetailsRow(nextDetails, ownerId), {
                onConflict: "home_id",
              });
            if (detailsResult.error) throw detailsResult.error;
            detailsSynced = true;
          } catch (error) {
            console.warn("Supabase property details write failed:", error);
            detailsSynced = false;
          }
        }
      }

      return { home: homeSynced, details: detailsSynced };
    },
    [data.details, data.homes, ownerId, v2Synced],
  );

  const removeHome = useCallback(
    (homeId: string) => {
      const home = data.homes.find((entry) => entry.id === homeId);
      if (!home) return;

      setData((current) => {
        const tourNotes = { ...current.tourNotes };
        delete tourNotes[homeId];
        const details = { ...current.details };
        delete details[homeId];
        return {
          ...current,
          homes: current.homes.filter((entry) => entry.id !== homeId),
          tourNotes,
          details,
          evaluations: current.evaluations.filter(
            (evaluation) => evaluation.homeId !== homeId,
          ),
          scenarios: current.scenarios.filter(
            (scenario) => scenario.propertyId !== homeId,
          ),
        };
      });

      // Property details and scenario FKs cascade from the home row.
      pushMutation(() => supabase!.from("homes").delete().eq("id", homeId));
    },
    [data.homes, pushMutation],
  );

  const toggleSaved = useCallback(
    (homeId: string) => {
      const home = data.homes.find((entry) => entry.id === homeId);
      if (!home) return;
      void updateHome(homeId, { saved: !home.saved });
    },
    [data.homes, updateHome],
  );

  const setTourRequested = useCallback(
    (homeId: string, value?: boolean) => {
      const home = data.homes.find((entry) => entry.id === homeId);
      if (!home) return;
      const tourRequested = value ?? !home.tourRequested;
      void updateHome(homeId, { tourRequested });
    },
    [data.homes, updateHome],
  );

  const toggleFavorite = useCallback(
    (homeId: string) => {
      const home = data.homes.find((entry) => entry.id === homeId);
      if (!home) return;
      void updateHome(homeId, { favorite: !home.favorite });
    },
    [data.homes, updateHome],
  );

  const toggleWishlistItem = useCallback(
    (itemId: string) => {
      const item = data.wishlist.find((entry) => entry.id === itemId);
      if (!item) return;
      const done = !item.done;
      setData((current) => ({
        ...current,
        wishlist: current.wishlist.map((entry) =>
          entry.id === itemId ? { ...entry, done } : entry,
        ),
      }));
      pushMutation(() =>
        supabase!.from("wishlist_items").update({ done }).eq("id", itemId),
      );
    },
    [data.wishlist, pushMutation],
  );

  const addWishlistItem = useCallback(
    (kind: WishlistKind, label: string, category: string | null = null) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      const position =
        data.wishlist
          .filter(
            (item) =>
              item.kind === kind && (item.category ?? null) === category,
          )
          .reduce((max, item) => Math.max(max, item.position), -1) + 1;
      const item: WishlistItem = {
        id: newId("wishlist-item"),
        kind,
        category,
        label: trimmed,
        done: false,
        position,
      };
      setData((current) => ({
        ...current,
        wishlist: [...current.wishlist, item],
      }));
      pushMutation(() =>
        supabase!.from("wishlist_items").insert(toWishlistRow(item)),
      );
    },
    [data.wishlist, pushMutation],
  );

  const createWishlistAction = useCallback(
    (
      name: string,
      budget: number | null = null,
      makeActive = false,
    ) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const active = makeActive || data.wishlists.length === 0;
      const wishlist = createWishlist(trimmed, {
        active,
        budget,
      });
      const deactivated = active
        ? data.wishlists
            .filter((entry) => entry.isActive)
            .map((entry) => ({ ...entry, isActive: false }))
        : [];
      setData((current) => ({
        ...current,
        wishlists: [
          ...current.wishlists.map((entry) =>
            active ? { ...entry, isActive: false } : entry,
          ),
          wishlist,
        ],
      }));
      pushV2(() =>
        supabase!
          .from("wishlists")
          .upsert(toWishlistV2Row(wishlist, ownerId), { onConflict: "id" }),
      );
      if (deactivated.length > 0) {
        pushV2(() =>
          supabase!
            .from("wishlists")
            .upsert(
              deactivated.map((entry) => toWishlistV2Row(entry, ownerId)),
              { onConflict: "id" },
            ),
        );
      }
      return wishlist;
    },
    [data.wishlists, ownerId, pushV2],
  );

  const renameWishlist = useCallback(
    (wishlistId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const existing = data.wishlists.find(
        (wishlist) => wishlist.id === wishlistId,
      );
      if (!existing) return;
      const updated: Wishlist = {
        ...existing,
        name: trimmed,
        updatedAt: nowIso(),
      };
      setData((current) => ({
        ...current,
        wishlists: current.wishlists.map((wishlist) =>
          wishlist.id === wishlistId ? updated : wishlist,
        ),
      }));
      pushV2(() =>
        supabase!
          .from("wishlists")
          .upsert(toWishlistV2Row(updated, ownerId), { onConflict: "id" }),
      );
    },
    [data.wishlists, ownerId, pushV2],
  );

  const duplicateWishlistAction = useCallback(
    (wishlistId: string, name?: string) => {
      const source = data.wishlists.find((wishlist) => wishlist.id === wishlistId);
      if (!source) return null;
      const copy = duplicateWishlist(
        source,
        data.requirements,
        name?.trim() || `${source.name} copy`,
      );
      setData((current) => ({
        ...current,
        wishlists: [...current.wishlists, copy.wishlist],
        requirements: [...current.requirements, ...copy.requirements],
      }));
      pushV2(() =>
        supabase!
          .from("wishlists")
          .upsert(toWishlistV2Row(copy.wishlist, ownerId), { onConflict: "id" }),
      );
      if (copy.requirements.length > 0) {
        pushV2(() =>
          supabase!
            .from("wishlist_requirements")
            .upsert(
              copy.requirements.map((requirement) =>
                toRequirementV2Row(requirement, ownerId),
              ),
              { onConflict: "id" },
            ),
        );
      }
      return copy.wishlist;
    },
    [data.requirements, data.wishlists, ownerId, pushV2],
  );

  const deleteWishlist = useCallback(
    (wishlistId: string) => {
      if (data.wishlists.length <= 1) return false;
      const remaining = data.wishlists.filter(
        (wishlist) => wishlist.id !== wishlistId,
      );
      const wasActive = data.wishlists.find(
        (wishlist) => wishlist.id === wishlistId,
      )?.isActive;
      const nextActiveId = wasActive ? remaining[0]?.id : undefined;
      setData((current) => ({
        ...current,
        wishlists: remaining.map((wishlist) => ({
          ...wishlist,
          isActive: nextActiveId ? wishlist.id === nextActiveId : wishlist.isActive,
        })),
        requirements: current.requirements.filter(
          (requirement) => requirement.wishlistId !== wishlistId,
        ),
        evaluations: current.evaluations.filter(
          (evaluation) => evaluation.wishlistId !== wishlistId,
        ),
        scenarios: current.scenarios.map((scenario) =>
          scenario.wishlistId === wishlistId
            ? { ...scenario, wishlistId: null }
            : scenario,
        ),
      }));
      pushV2(() => supabase!.from("wishlists").delete().eq("id", wishlistId));
      if (nextActiveId) {
        pushV2(() =>
          supabase!
            .from("wishlists")
            .update({ is_active: true })
            .eq("id", nextActiveId),
        );
      }
      return true;
    },
    [data.wishlists, pushV2],
  );

  const setActiveWishlist = useCallback(
    (wishlistId: string) => {
      if (!data.wishlists.some((wishlist) => wishlist.id === wishlistId)) return;
      const changed = data.wishlists
        .filter((wishlist) => wishlist.isActive !== (wishlist.id === wishlistId))
        .map((wishlist) => ({
          ...wishlist,
          isActive: wishlist.id === wishlistId,
        }));
      setData((current) => ({
        ...current,
        wishlists: current.wishlists.map((wishlist) => ({
          ...wishlist,
          isActive: wishlist.id === wishlistId,
        })),
      }));
      if (changed.length > 0) {
        pushV2(() =>
          supabase!
            .from("wishlists")
            .upsert(
              changed.map((wishlist) => toWishlistV2Row(wishlist, ownerId)),
              { onConflict: "id" },
            ),
        );
      }
    },
    [data.wishlists, ownerId, pushV2],
  );

  const updateWishlistBudget = useCallback(
    (wishlistId: string, budget: number | null) => {
      const value =
        budget !== null && Number.isFinite(budget) && budget > 0 ? budget : null;
      const existing = data.wishlists.find(
        (wishlist) => wishlist.id === wishlistId,
      );
      if (!existing) return;
      const updated: Wishlist = {
        ...existing,
        budget: value,
        updatedAt: nowIso(),
      };
      setData((current) => ({
        ...current,
        wishlists: current.wishlists.map((wishlist) =>
          wishlist.id === wishlistId ? updated : wishlist,
        ),
      }));
      pushV2(() =>
        supabase!
          .from("wishlists")
          .upsert(toWishlistV2Row(updated, ownerId), { onConflict: "id" }),
      );
    },
    [data.wishlists, ownerId, pushV2],
  );

  const addRequirement = useCallback(
    (input: Parameters<typeof createRequirement>[0]) => {
      const position =
        data.requirements
          .filter((requirement) => requirement.wishlistId === input.wishlistId)
          .reduce((max, requirement) => Math.max(max, requirement.position), -1) +
        1;
      const requirement = createRequirement({
        ...input,
        position,
        configured: input.configured ?? true,
      });
      setData((current) => ({
        ...current,
        requirements: [...current.requirements, requirement],
      }));
      pushV2(() =>
        supabase!
          .from("wishlist_requirements")
          .upsert(toRequirementV2Row(requirement, ownerId), {
            onConflict: "id",
          }),
      );
      return requirement;
    },
    [data.requirements, ownerId, pushV2],
  );

  const updateRequirement = useCallback(
    (requirementId: string, patch: Partial<WishlistRequirement>) => {
      const existing = data.requirements.find(
        (requirement) => requirement.id === requirementId,
      );
      if (!existing) return;
      const updated: WishlistRequirement = {
        ...existing,
        ...patch,
        updatedAt: nowIso(),
      };
      setData((current) => ({
        ...current,
        requirements: current.requirements.map((requirement) =>
          requirement.id === requirementId ? updated : requirement,
        ),
      }));
      pushV2(() =>
        supabase!
          .from("wishlist_requirements")
          .upsert(toRequirementV2Row(updated, ownerId), { onConflict: "id" }),
      );
    },
    [data.requirements, ownerId, pushV2],
  );

  const removeRequirement = useCallback(
    (requirementId: string) => {
      setData((current) => ({
        ...current,
        requirements: current.requirements.filter(
          (requirement) => requirement.id !== requirementId,
        ),
        evaluations: current.evaluations.filter(
          (evaluation) => evaluation.requirementId !== requirementId,
        ),
      }));
      pushV2(() =>
        supabase!.from("wishlist_requirements").delete().eq("id", requirementId),
      );
    },
    [pushV2],
  );

  const setEvaluation = useCallback(
    (
      homeId: string,
      wishlistId: string,
      requirementId: string,
      state: EvaluationState,
    ) => {
      const id = evaluationId(homeId, wishlistId, requirementId);
      if (state === "unknown") {
        setData((current) => ({
          ...current,
          evaluations: current.evaluations.filter((entry) => entry.id !== id),
        }));
        pushEvaluation(() =>
          supabase!.from("property_evaluations").delete().eq("id", id),
        );
        return;
      }

      const existing = data.evaluations.find((entry) => entry.id === id);
      const timestamp = nowIso();
      const evaluation: PropertyEvaluation = {
        id,
        homeId,
        wishlistId,
        requirementId,
        state,
        createdAt: existing?.createdAt || timestamp,
        updatedAt: timestamp,
      };
      setData((current) => ({
        ...current,
        evaluations: [
          ...current.evaluations.filter((entry) => entry.id !== id),
          evaluation,
        ],
      }));
      pushEvaluation(() =>
        supabase!
          .from("property_evaluations")
          .upsert(toEvaluationRow(evaluation, ownerId), { onConflict: "id" }),
      );
    },
    [data.evaluations, ownerId, pushEvaluation],
  );

  const saveTourNote = useCallback(
    (
      homeId: string,
      patch: Pick<TourNote, "rating" | "notes" | "pros" | "cons">,
    ) => {
      const note: TourNote = {
        homeId,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      setData((current) => ({
        ...current,
        tourNotes: { ...current.tourNotes, [homeId]: note },
      }));
      pushMutation(() =>
        supabase!
          .from("tour_notes")
          .upsert(toTourNoteRow(note), { onConflict: "home_id" }),
      );
    },
    [pushMutation],
  );

  const updateBudget = useCallback(
    (patch: Partial<BudgetSettings>) => {
      const nextBudget = { ...data.budget, ...patch };
      setData((current) => ({
        ...current,
        budget: { ...current.budget, ...patch },
      }));
      if (!hasSupabaseConfig || status !== "synced") return;
      if (budgetTimer.current) clearTimeout(budgetTimer.current);
      budgetTimer.current = setTimeout(() => {
        void supabase!
          .from("budget_settings")
          .upsert(toBudgetRow(nextBudget), { onConflict: "id" });
      }, 500);
    },
    [data.budget, status],
  );

  const addComparisonNote = useCallback(
    (body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      const note: ComparisonNote = {
        id: newId("note"),
        body: trimmed,
        createdAt: new Date().toISOString(),
      };
      setData((current) => ({
        ...current,
        comparisonNotes: [...current.comparisonNotes, note],
      }));
      pushMutation(() =>
        supabase!.from("comparison_notes").insert({
          id: note.id,
          body: note.body,
          created_at: note.createdAt,
        }),
      );
    },
    [pushMutation],
  );

  const saveScenarioInputs = useCallback(
    (
      inputs: BudgetInputs,
      propertyId: string | null = null,
      confirmed?: boolean,
    ) => {
      const active = pickActiveWishlist(data.wishlists);
      const existing = data.scenarios.find((scenario) =>
        propertyId
          ? scenario.propertyId === propertyId
          : scenario.propertyId === null &&
            (scenario.wishlistId === active?.id || scenario.wishlistId === null),
      );
      const scenario: BudgetScenario = {
        // Stable ids make repeated writes idempotent: a fast Enter key or two
        // quick edits cannot create duplicate property plans.
        id:
          existing?.id ??
          (propertyId
            ? `scenario-property-${propertyId}`
            : `scenario-wishlist-${active?.id ?? "default"}`),
        name:
          existing?.name ??
          (propertyId
            ? data.homes.find((home) => home.id === propertyId)?.address ??
              "Property plan"
            : "Baseline plan"),
        wishlistId: existing?.wishlistId ?? active?.id ?? null,
        propertyId,
        inputs,
        confirmed: confirmed ?? existing?.confirmed ?? false,
        updatedAt: nowIso(),
      };
      setData((current) => ({
        ...current,
        scenarios: [
          ...current.scenarios.filter(
            (entry) =>
              entry.id !== scenario.id &&
              (!propertyId || entry.propertyId !== propertyId),
          ),
          scenario,
        ],
      }));
      pushV2(() =>
        supabase!
          .from("budget_scenarios")
          .upsert(toScenarioRow(scenario, ownerId), { onConflict: "id" }),
      );
      return scenario;
    },
    [data.homes, data.scenarios, data.wishlists, ownerId, pushV2],
  );

  const updateScenarioInputs = useCallback(
    (scenarioId: string, inputs: BudgetInputs, confirmed?: boolean) => {
      const existing = data.scenarios.find(
        (scenario) => scenario.id === scenarioId,
      );
      if (!existing) return;
      const updated: BudgetScenario = {
        ...existing,
        inputs,
        confirmed: confirmed ?? existing.confirmed,
        updatedAt: nowIso(),
      };
      setData((current) => ({
        ...current,
        scenarios: current.scenarios.map((scenario) =>
          scenario.id === scenarioId ? updated : scenario,
        ),
      }));
      pushV2(() =>
        supabase!
          .from("budget_scenarios")
          .upsert(toScenarioRow(updated, ownerId), { onConflict: "id" }),
      );
    },
    [data.scenarios, ownerId, pushV2],
  );

  useEffect(
    () => () => {
      if (budgetTimer.current) clearTimeout(budgetTimer.current);
    },
    [],
  );

  const value = useMemo<AppData>(() => {
    const active = pickActiveWishlist(data.wishlists);
    const activeRequirements = requirementsFor(
      data.requirements,
      active?.id ?? null,
    );
    const progress = wishlistSetupProgress(activeRequirements);
    const savedHomes = data.homes.filter((home) => home.saved);

    const defaultScenario =
      data.scenarios.find(
        (scenario) =>
          scenario.propertyId === null &&
          (scenario.wishlistId === active?.id || scenario.wishlistId === null),
      ) ??
      data.scenarios.find((scenario) => scenario.propertyId === null) ?? {
        id: "scenario-default",
        name: "Baseline plan",
        wishlistId: active?.id ?? null,
        propertyId: null,
        inputs: DEFAULT_BUDGET_INPUTS,
        confirmed: false,
        updatedAt: "",
      };

    const scoredHomes: ScoredHome[] = data.homes.map((home) => {
      const propertyScenario = data.scenarios.find(
        (scenario) => scenario.propertyId === home.id,
      );
      const inputs = propertyScenario
        ? propertyScenario.inputs
        : inputsForProperty(
            { price: home.price, hoa: home.hoa },
            {
              downPercent: defaultScenario.inputs.downPercent,
              rate: defaultScenario.inputs.rate,
              termYears: defaultScenario.inputs.termYears,
              targetMonthly: defaultScenario.inputs.targetMonthly,
            },
          );
      const budgetEstimate = budgetEstimateInfo({
        price: home.price,
        hoaKnown:
          hoaIsKnown(home) ||
          (propertyScenario?.inputs.monthlyHoa ?? 0) > 0,
        confirmed: propertyScenario?.confirmed ?? false,
      });
      const rawMonthlyCost =
        home.price > 0 ? calculateBudget(inputs).totalMonthly : null;
      const monthlyCost =
        budgetEstimate.status === "partial" ? null : rawMonthlyCost;
      const facts = factsFromHome(home, {
        monthlyOwnershipCost: monthlyCost,
      });
      const manual = manualEvaluationMap(
        data.evaluations,
        home.id,
        active?.id ?? "",
      );
      const score = scoreRequirements(
        activeRequirements,
        facts,
        DEFAULT_WEIGHTS,
        { manual },
      );
      return {
        home,
        facts,
        score,
        monthlyCost: rawMonthlyCost,
        budgetEstimate,
      };
    });

    const scoredSaved = scoredHomes.filter((entry) => entry.home.saved);
    const topMatches = scoredSaved
      .filter(
        (entry) => !entry.score.disqualified && entry.score.score !== null,
      )
      .sort(
        (a, b) =>
          (b.score.score ?? 0) - (a.score.score ?? 0) ||
          b.score.coverage - a.score.coverage,
      );

    const evaluationSummaries: EvaluationSummary[] = scoredSaved.map((entry) => {
      const rows = buildEvaluationRows(
        activeRequirements,
        entry.facts,
        data.evaluations,
        entry.home.id,
        active?.id ?? "",
      );
      const progress = evaluationProgress(rows);
      return {
        home: entry.home,
        answered: progress.answered,
        unanswered: progress.unanswered,
        total: progress.total,
        percent: progress.percent,
      };
    });

    const pendingEvaluations = evaluationSummaries.filter(
      (summary) => summary.total > 0 && summary.unanswered > 0,
    );

    const homesNeedingEvaluation = scoredSaved.filter(
      (entry) =>
        !entry.score.disqualified &&
        (entry.score.score === null ||
          entry.score.coverage < 50 ||
          entry.score.mustUnknown.length > 0 ||
          entry.score.dealbreakersUnknown.length > 0),
    );

    const topMatch =
      topMatches[0]?.home ??
      savedHomes[0] ??
      data.homes[0] ??
      DEFAULT_HOMES[0];

    const today = new Date().toISOString().slice(0, 10);
    const upcomingTours = data.homes.filter((home) => {
      if (home.tourStatus === "cancelled" || home.tourStatus === "toured") {
        return false;
      }
      if (home.tourDate && home.tourDate >= today) return true;
      return home.tourRequested && !home.tourDate;
    }).length;

    const mustRequirements = activeRequirements.filter(
      (requirement) => requirement.importance === "must",
    );

    return {
      ...data,
      ready,
      status,
      configured: hasSupabaseConfig,
      v2Synced,
      saving: pendingWrites > 0,
      topMatch,
      savedCount: savedHomes.length,
      upcomingTours,
      strongMatches: topMatches.length,
      wishlistDone: progress.configured,
      wishlistTotal: progress.total,
      mustDone: mustRequirements.filter((requirement) => requirement.configured)
        .length,
      mustTotal: mustRequirements.length,
      activeWishlist: active,
      activeRequirements,
      wishlistProgress: progress,
      scoredHomes,
      topMatches,
      homesNeedingEvaluation,
      evaluations: data.evaluations,
      evaluationsSynced,
      evaluationSummaries,
      pendingEvaluations,
      nextEvaluationHome: pendingEvaluations[0]?.home ?? null,
      defaultScenario,
      activeScenario: defaultScenario,
      getScoreForHome: (homeId: string) =>
        scoredHomes.find((entry) => entry.home.id === homeId)?.score ?? null,
      getFactsForHome: (homeId: string) =>
        scoredHomes.find((entry) => entry.home.id === homeId)?.facts ?? null,
      getEvaluationRows: (homeId: string, wishlistId: string) => {
        const entry = scoredHomes.find(
          (candidate) => candidate.home.id === homeId,
        );
        if (!entry) return [];
        return buildEvaluationRows(
          requirementsFor(data.requirements, wishlistId),
          entry.facts,
          data.evaluations,
          homeId,
          wishlistId,
        );
      },
      getMonthlyCostForHome: (homeId: string) => {
        const entry = scoredHomes.find(
          (candidate) => candidate.home.id === homeId,
        );
        return entry && entry.budgetEstimate.status !== "partial"
          ? entry.monthlyCost
          : null;
      },
      getBudgetEstimateForHome: (homeId: string) =>
        scoredHomes.find((entry) => entry.home.id === homeId)?.budgetEstimate ??
        null,
      getBudgetScenarioForProperty: (homeId: string) =>
        data.scenarios.find((scenario) => scenario.propertyId === homeId) ??
        null,
      setEvaluation,
      addHome,
      updateHome,
      removeHome,
      toggleSaved,
      setTourRequested,
      toggleFavorite,
      toggleWishlistItem,
      addWishlistItem,
      createWishlist: createWishlistAction,
      renameWishlist,
      duplicateWishlist: duplicateWishlistAction,
      deleteWishlist,
      setActiveWishlist,
      updateWishlistBudget,
      addRequirement,
      updateRequirement,
      removeRequirement,
      saveTourNote,
      updateBudget,
      addComparisonNote,
      saveScenarioInputs,
      updateScenarioInputs,
    };
  }, [
    data,
    ready,
    status,
    v2Synced,
    evaluationsSynced,
    pendingWrites,
    setEvaluation,
    addHome,
    updateHome,
    removeHome,
    toggleSaved,
    setTourRequested,
    toggleFavorite,
    toggleWishlistItem,
    addWishlistItem,
    createWishlistAction,
    renameWishlist,
    duplicateWishlistAction,
    deleteWishlist,
    setActiveWishlist,
    updateWishlistBudget,
    addRequirement,
    updateRequirement,
    removeRequirement,
    saveTourNote,
    updateBudget,
    addComparisonNote,
    saveScenarioInputs,
    updateScenarioInputs,
  ]);

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return value;
}
