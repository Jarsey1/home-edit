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
import type { Home } from "./homes";
import { hasSupabaseConfig, supabase } from "./supabase";
import type {
  BudgetSettings,
  ComparisonNote,
  TourNote,
  WishlistItem,
  WishlistKind,
} from "./types";

type Snapshot = {
  homes: Home[];
  wishlist: WishlistItem[];
  tourNotes: Record<string, TourNote>;
  budget: BudgetSettings;
  comparisonNotes: ComparisonNote[];
};

type SyncStatus = "loading" | "synced" | "local";

export type NewHomeInput = {
  address: string;
  city: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
};

type AppData = Snapshot & {
  ready: boolean;
  status: SyncStatus;
  configured: boolean;
  topMatch: Home;
  savedCount: number;
  upcomingTours: number;
  strongMatches: number;
  wishlistDone: number;
  wishlistTotal: number;
  mustDone: number;
  mustTotal: number;
  addHome: (input: NewHomeInput) => Home | null;
  toggleSaved: (homeId: string) => void;
  setTourRequested: (homeId: string, value?: boolean) => void;
  toggleWishlistItem: (itemId: string) => void;
  addWishlistItem: (
    kind: WishlistKind,
    label: string,
    category?: string | null,
  ) => void;
  saveTourNote: (
    homeId: string,
    patch: Pick<TourNote, "rating" | "notes" | "pros" | "cons">,
  ) => void;
  updateBudget: (patch: Partial<BudgetSettings>) => void;
  addComparisonNote: (body: string) => void;
};

const STORAGE_KEY = "next-home-edit:data:v2";

const AppDataContext = createContext<AppData | null>(null);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function defaultSnapshot(): Snapshot {
  return {
    homes: clone(DEFAULT_HOMES),
    wishlist: clone(DEFAULT_WISHLIST),
    tourNotes: clone(DEFAULT_TOUR_NOTES),
    budget: { ...DEFAULT_BUDGET },
    comparisonNotes: clone(DEFAULT_COMPARISON_NOTES),
  };
}

function readStored(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Snapshot> | null;
    if (!parsed || typeof parsed !== "object") return null;
    const base = defaultSnapshot();
    return {
      homes:
        Array.isArray(parsed.homes) && parsed.homes.length > 0
          ? parsed.homes
          : base.homes,
      wishlist:
        Array.isArray(parsed.wishlist) && parsed.wishlist.length > 0
          ? parsed.wishlist
          : base.wishlist,
      tourNotes:
        parsed.tourNotes && typeof parsed.tourNotes === "object"
          ? parsed.tourNotes
          : base.tourNotes,
      budget: parsed.budget
        ? { ...base.budget, ...parsed.budget }
        : base.budget,
      comparisonNotes: Array.isArray(parsed.comparisonNotes)
        ? parsed.comparisonNotes
        : [],
    };
  } catch {
    return null;
  }
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Snapshot>(defaultSnapshot);
  const [status, setStatus] = useState<SyncStatus>("loading");
  const [ready, setReady] = useState(false);
  const budgetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        const [homesResult, wishlistResult, notesResult, budgetResult, comparisonResult] =
          await Promise.all([
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

        const next: Snapshot = {
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
        };

        // First-run seed: keep the demo content when a table is still empty.
        if (next.homes.length === 0) {
          next.homes = clone(DEFAULT_HOMES);
          await client
            .from("homes")
            .upsert(next.homes.map(toHomeRow), { onConflict: "id" });
        }

        if (next.wishlist.length === 0) {
          next.wishlist = clone(DEFAULT_WISHLIST);
          await client
            .from("wishlist_items")
            .upsert(next.wishlist.map(toWishlistRow), { onConflict: "id" });
        }

        if (Object.keys(next.tourNotes).length === 0) {
          next.tourNotes = clone(DEFAULT_TOUR_NOTES);
          await client
            .from("tour_notes")
            .upsert(Object.values(next.tourNotes).map(toTourNoteRow), {
              onConflict: "home_id",
            });
        }

        if (!budgetResult.data) {
          await client
            .from("budget_settings")
            .upsert(toBudgetRow(next.budget), { onConflict: "id" });
        }

        if (cancelled) return;
        setData(next);
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

  // Offline / unconfigured fallback keeps working across reloads.
  useEffect(() => {
    if (!ready || status !== "local") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage can be full or blocked; the in-memory state still works.
    }
  }, [data, ready, status]);

  const pushMutation = useCallback(
    (run: () => PromiseLike<{ error: { message: string } | null }>) => {
      if (!hasSupabaseConfig || status !== "synced") return;
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
        }
      })();
    },
    [status],
  );

  const addHome = useCallback(
    (input: NewHomeInput): Home | null => {
      const address = input.address.trim();
      if (!address) return null;
      const duplicate = data.homes.some(
        (home) => home.address.trim().toLowerCase() === address.toLowerCase(),
      );
      if (duplicate) return null;

      const home: Home = {
        id: newId(),
        address,
        city: input.city.trim(),
        price: Number.isFinite(input.price) ? Math.max(0, input.price) : 0,
        match: 0,
        beds: Number.isFinite(input.beds) ? Math.max(0, input.beds) : 0,
        baths: Number.isFinite(input.baths) ? Math.max(0, input.baths) : 0,
        sqft: Number.isFinite(input.sqft) ? Math.max(0, input.sqft) : 0,
        lot: "",
        garage: "",
        pool: false,
        gated: false,
        hoa: 0,
        yearBuilt: 0,
        type: "Single family",
        daysOnMarket: 0,
        imageFilter: "none",
        description: "",
        features: [],
        saved: true,
        tourRequested: false,
      };

      setData((current) => ({
        ...current,
        homes: [...current.homes, home],
      }));
      pushMutation(() =>
        supabase!
          .from("homes")
          .insert(toHomeRow(home, data.homes.length)),
      );

      return home;
    },
    [data.homes, pushMutation],
  );

  const toggleSaved = useCallback(
    (homeId: string) => {
      const home = data.homes.find((entry) => entry.id === homeId);
      if (!home) return;
      const saved = !home.saved;
      setData((current) => ({
        ...current,
        homes: current.homes.map((entry) =>
          entry.id === homeId ? { ...entry, saved } : entry,
        ),
      }));
      pushMutation(() =>
        supabase!.from("homes").update({ saved }).eq("id", homeId),
      );
    },
    [data.homes, pushMutation],
  );

  const setTourRequested = useCallback(
    (homeId: string, value?: boolean) => {
      const home = data.homes.find((entry) => entry.id === homeId);
      if (!home) return;
      const tourRequested = value ?? !home.tourRequested;
      setData((current) => ({
        ...current,
        homes: current.homes.map((entry) =>
          entry.id === homeId ? { ...entry, tourRequested } : entry,
        ),
      }));
      pushMutation(() =>
        supabase!
          .from("homes")
          .update({ tour_requested: tourRequested })
          .eq("id", homeId),
      );
    },
    [data.homes, pushMutation],
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
        id: newId(),
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
        id: newId(),
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

  useEffect(
    () => () => {
      if (budgetTimer.current) clearTimeout(budgetTimer.current);
    },
    [],
  );

  const value = useMemo<AppData>(() => {
    const savedHomes = data.homes.filter((home) => home.saved);
    const topMatch =
      [...data.homes].sort((a, b) => b.match - a.match)[0] ?? DEFAULT_HOMES[0];
    const mustItems = data.wishlist.filter((item) => item.kind === "must");

    return {
      ...data,
      ready,
      status,
      configured: hasSupabaseConfig,
      topMatch,
      savedCount: savedHomes.length,
      upcomingTours: data.homes.filter((home) => home.tourRequested).length,
      strongMatches: data.homes.filter((home) => home.match >= 75).length,
      wishlistDone: data.wishlist.filter((item) => item.done).length,
      wishlistTotal: data.wishlist.length,
      mustDone: mustItems.filter((item) => item.done).length,
      mustTotal: mustItems.length,
      addHome,
      toggleSaved,
      setTourRequested,
      toggleWishlistItem,
      addWishlistItem,
      saveTourNote,
      updateBudget,
      addComparisonNote,
    };
  }, [
    data,
    ready,
    status,
    addHome,
    toggleSaved,
    setTourRequested,
    toggleWishlistItem,
    addWishlistItem,
    saveTourNote,
    updateBudget,
    addComparisonNote,
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
