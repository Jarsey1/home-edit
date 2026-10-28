export type WishlistKind = "category" | "must" | "nice";

export type WishlistItem = {
  id: string;
  kind: WishlistKind;
  category: string | null;
  label: string;
  done: boolean;
  position: number;
};

export type TourNote = {
  homeId: string;
  rating: number;
  notes: string;
  pros: string[];
  cons: string[];
  updatedAt: string;
};

export type BudgetSettings = {
  price: number;
  downPercent: number;
  term: number;
  rate: number;
};

export type ComparisonNote = {
  id: string;
  body: string;
  createdAt: string;
};
