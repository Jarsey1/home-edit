import { HOMES } from "./homes";
import type {
  BudgetSettings,
  ComparisonNote,
  TourNote,
  WishlistItem,
} from "./types";

const CATEGORY_SEED: {
  name: string;
  items: [label: string, done: boolean][];
}[] = [
  {
    name: "Bedrooms & Workspaces",
    items: [
      ["3+ bedrooms", true],
      ["Primary suite", true],
      ["Dedicated home office", true],
      ["Guest room", true],
      ["Walk-in closet", true],
      ["Flexible playroom", false],
      ["Separate laundry room", false],
    ],
  },
  {
    name: "Interior & Layout",
    items: [
      ["Open floor plan", true],
      ["High ceilings", true],
      ["Ample storage", true],
      ["Indoor-outdoor flow", true],
      ["Separate dining room", false],
      ["Mudroom", false],
      ["Bonus room", false],
      ["Hardwood floors", false],
      ["Dedicated office nook", false],
    ],
  },
  {
    name: "Kitchen",
    items: [
      ["Kitchen island", true],
      ["Gas range", true],
      ["Double oven", true],
      ["Updated cabinets", false],
      ["Walk-in pantry", false],
      ["Breakfast nook", false],
    ],
  },
  {
    name: "Outdoor Space",
    items: [
      ["Fenced yard", true],
      ["Covered patio", true],
      ["Pool", true],
      ["Garden space", true],
      ["Outdoor kitchen", false],
      ["Room for a playset", false],
    ],
  },
  {
    name: "Community Amenities",
    items: [
      ["Gated entry", true],
      ["Walking trails", true],
      ["Dog park", true],
      ["Community gym", false],
      ["Playground", false],
      ["Clubhouse", false],
      ["Tennis courts", false],
      ["Guest parking", false],
    ],
  },
  {
    name: "Location & Neighborhood",
    items: [
      ["Good schools", true],
      ["Quiet street", true],
      ["Walkable errands", false],
      ["Near parks", false],
      ["Short commute", false],
      ["Low flood risk", false],
      ["Grocery nearby", false],
      ["Easy highway access", false],
    ],
  },
  {
    name: "Home Condition",
    items: [
      ["Move-in ready", true],
      ["New roof", false],
      ["HVAC under 5 years", false],
      ["Updated electrical", false],
      ["New windows", false],
      ["Recently painted", false],
      ["No major repairs", false],
    ],
  },
];

const MUST_SEED: [label: string, done: boolean][] = [
  ["3+ bedrooms", true],
  ["2+ bathrooms", true],
  ["Dedicated home office", true],
  ["2-car garage", true],
  ["Updated kitchen", true],
  ["Fenced backyard", true],
  ["Good school district", false],
  ["Central air", false],
  ["Laundry room", false],
  ["Walk-in closet", false],
  ["Storage space", false],
  ["Pet-friendly yard", false],
];

const NICE_SEED: [label: string, done: boolean][] = [
  ["Pool", true],
  ["Gated community", true],
  ["Fireplace", false],
  ["Water view", false],
  ["Outdoor kitchen", false],
  ["Smart home", false],
  ["Guest suite", false],
  ["EV charger", false],
];

export function buildWishlistDefaults(): WishlistItem[] {
  const categoryItems = CATEGORY_SEED.flatMap((category, categoryIndex) =>
    category.items.map(([label, done], position) => ({
      id: `default-cat-${categoryIndex}-${position}`,
      kind: "category" as const,
      category: category.name,
      label,
      done,
      position,
    })),
  );

  const mustItems = MUST_SEED.map(([label, done], position) => ({
    id: `default-must-${position}`,
    kind: "must" as const,
    category: null,
    label,
    done,
    position,
  }));

  const niceItems = NICE_SEED.map(([label, done], position) => ({
    id: `default-nice-${position}`,
    kind: "nice" as const,
    category: null,
    label,
    done,
    position,
  }));

  return [...categoryItems, ...mustItems, ...niceItems];
}

export const DEFAULT_WISHLIST = buildWishlistDefaults();

export const DEFAULT_TOUR_NOTES: Record<string, TourNote> = {
  "palm-lane": {
    homeId: "palm-lane",
    rating: 4,
    notes:
      "Loved the layout and backyard. Kitchen needs updated cabinets. Good natural light.",
    pros: [
      "Great natural light",
      "Open, connected layout",
      "Backyard and pool",
      "Quiet street",
    ],
    cons: ["Kitchen cabinets need updating", "Primary bath feels dated"],
    updatedAt: "",
  },
  "oak-drive": {
    homeId: "oak-drive",
    rating: 3,
    notes: "",
    pros: [],
    cons: [],
    updatedAt: "",
  },
  lakeview: {
    homeId: "lakeview",
    rating: 4,
    notes: "",
    pros: [],
    cons: [],
    updatedAt: "",
  },
};

export const DEFAULT_BUDGET: BudgetSettings = {
  price: 1_250_000,
  downPercent: 20,
  term: 30,
  rate: 6.5,
};

export const DEFAULT_COMPARISON_NOTES: ComparisonNote[] = [];

export const DEFAULT_HOMES = HOMES;
