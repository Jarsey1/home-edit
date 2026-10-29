"use client";

import {
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { useAppData, type ScoredHome } from "../../lib/app-data";
import {
  defaultComparisonIds,
  normalizeComparisonIds,
  selectedHomes,
  toggleComparisonId,
} from "../../lib/comparison";
import {
  formatGarageLabel,
  formatLotLabel,
  formatPrice,
  formatPriceOrPending,
} from "../../lib/homes";
import {
  translatePropertyType,
  translateRequirementName,
  translateWishlistName,
  useI18n,
} from "../../lib/i18n";
import {
  requirementDisplayStatus,
  matchStatus,
  type MatchStatus,
  type RequirementDisplayStatus,
} from "../../lib/match-status";
import {
  isRequirementComplete,
  isRequirementReadyToActivate,
  isRequirementScoreable,
} from "../../lib/requirement-config";
import { buildComparisonSummary, type ScoreResult } from "../../lib/scoring";
import type { EvaluationRow } from "../../lib/evaluations";
import {
  FEATURE_BY_KEY,
  type FactValue,
  type WishlistRequirement,
} from "../../lib/v2-types";
import { PropertyPhoto } from "../property-photo";
import { Sheet } from "../sheet";
import {
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
  QuestionIcon,
  TrashIcon,
  XIcon,
} from "../icons";

type SectionId = "match" | "details" | "financial" | "neighborhood" | "community";

type CompareEntry = {
  home: ScoredHome["home"];
  score: ScoreResult;
  monthlyCost: number | null;
  budgetStatus: ScoredHome["budgetEstimate"]["status"];
  facts: ScoredHome["facts"];
};

type Row = {
  label: string;
  render: (entry: CompareEntry) => ReactNode;
};

function statusText(
  score: ScoreResult,
  t: ReturnType<typeof useI18n>["t"],
): string {
  switch (score.status) {
    case "disqualified":
      return t("compare.statusDisqualified");
    case "missing-must":
      return t("compare.statusMissing", { count: score.mustMissing.length });
    case "awaiting-verification":
      return t("compare.statusUnverified", {
        count: score.mustUnknown.length,
      });
    case "meets-all-must":
      return t("compare.statusMeetsAll");
    case "no-must-haves":
      return t("compare.statusNoMust");
    default:
      return t("compare.statusInsufficient");
  }
}

function statusTone(score: ScoreResult) {
  if (score.disqualified) return "text-clay";
  if (score.status === "missing-must") return "text-clay";
  if (
    score.status === "awaiting-verification" ||
    score.status === "insufficient"
  ) {
    return "text-muted";
  }
  return "text-olive";
}

function matchStatusKey(status: MatchStatus) {
  switch (status) {
    case "not-ready":
      return "matchStatus.notReady" as const;
    case "insufficient":
      return "matchStatus.insufficient" as const;
    case "disqualified":
      return "matchStatus.disqualified" as const;
    case "scored":
      return "matchStatus.scored" as const;
    default:
      return "matchStatus.partial" as const;
  }
}

function matchStatusStyle(status: MatchStatus) {
  if (status === "scored") return "bg-olive/10 text-olive";
  if (status === "disqualified") return "bg-clay/10 text-clay";
  if (status === "not-ready" || status === "insufficient") {
    return "bg-gold/10 text-[#6b5535]";
  }
  return "bg-parchment text-muted";
}

function requirementStatusKey(status: RequirementDisplayStatus) {
  switch (status) {
    case "met":
      return "compare.statusMet" as const;
    case "not-met":
      return "compare.statusNotMet" as const;
    case "config-needed":
      return "compare.statusConfigNeeded" as const;
    case "ready":
      return "compare.statusReady" as const;
    default:
      return "compare.statusUnknown" as const;
  }
}

function requirementStatusStyle(status: RequirementDisplayStatus) {
  if (status === "met") return "bg-olive/10 text-olive";
  if (status === "not-met") return "bg-clay/10 text-clay";
  if (status === "config-needed") return "bg-gold/10 text-[#6b5535]";
  if (status === "ready") return "bg-olive/[0.08] text-olive";
  return "bg-parchment text-muted";
}

function requiredCondition(
  requirement: WishlistRequirement,
  locale: "en" | "es",
  t: ReturnType<typeof useI18n>["t"],
) {
  const value = requirement.expectedValue;
  if (requirement.type === "yes") {
    return value === true ? t("common.yes") : t("common.no");
  }
  if (requirement.type === "range" && value && typeof value === "object") {
    const range = value as { min?: number; max?: number };
    return `${range.min ?? "?"} – ${range.max ?? "?"}`;
  }
  if (typeof value === "number") {
    const currency =
      requirement.featureKey === "price" ||
      requirement.featureKey === "monthlyOwnershipCost" ||
      requirement.featureKey === "hoa";
    const formatted = currency ? formatPrice(value, locale) : String(value);
    if (requirement.type === "min") return `≥ ${formatted}`;
    if (requirement.type === "max") return `≤ ${formatted}`;
    return formatted;
  }
  if (value && typeof value === "object" && "values" in value) {
    return (value as { values: string[] }).values.join(", ");
  }
  return value === null || value === "" ? "—" : String(value);
}

function factValueLabel(
  value: unknown,
  featureKey: string,
  locale: "en" | "es",
  t: ReturnType<typeof useI18n>["t"],
) {
  if (value === null || value === undefined || value === "") {
    return t("compare.notRecorded");
  }
  if (typeof value === "boolean") {
    return value ? t("common.yes") : t("common.no");
  }
  if (typeof value === "number") {
    if (
      featureKey === "price" ||
      featureKey === "monthlyOwnershipCost" ||
      featureKey === "hoa"
    ) {
      return formatPrice(value, locale);
    }
    return String(value);
  }
  return String(value);
}

function BooleanCell({ value }: { value: unknown }) {
  if (value === true) {
    return <CheckIcon className="mx-auto h-4 w-4 text-olive" />;
  }
  if (value === false) {
    return <XIcon className="mx-auto h-3.5 w-3.5 text-muted/45" />;
  }
  return <span className="text-[10px] text-muted">—</span>;
}

function fact(entry: CompareEntry, key: string) {
  const value = entry.facts[key];
  return value === undefined ? null : value;
}

export function CompareScreen({
  onOpenProperty,
  onOpenBudget,
  onOpenWishlist,
  onEvaluate,
  onEditProperty,
  onOpenRequirement,
  onAddHome,
}: {
  onOpenProperty: (homeId: string) => void;
  onOpenBudget: (homeId: string) => void;
  onOpenWishlist: () => void;
  onEvaluate: (homeId: string) => void;
  onEditProperty: (homeId: string, featureKey?: string) => void;
  onOpenRequirement: (requirementId: string) => void;
  onAddHome: () => void;
}) {
  const {
    homes,
    activeWishlist,
    activeRequirements,
    comparisonNotes,
    addComparisonNote,
    removeHome,
    scoredHomes,
    getEvaluationRows,
    activateRequirements,
    saveHomeFact,
    ready,
  } = useAppData();
  const { t, locale } = useI18n();
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    defaultComparisonIds(homes, 2),
  );
  const [selectionMessage, setSelectionMessage] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [mustHavesFor, setMustHavesFor] = useState<string | null>(null);
  const [missingInfoFor, setMissingInfoFor] = useState<string | null>(null);
  const [activateBusy, setActivateBusy] = useState(false);
  const [activateNotice, setActivateNotice] = useState("");
  const [pendingRemove, setPendingRemove] = useState<{
    id: string;
    address: string;
  } | null>(null);
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>({
    match: true,
    details: true,
    financial: true,
    neighborhood: true,
    community: true,
  });

  const selected = useMemo(
    () => selectedHomes(homes, selectedIds, 2),
    [homes, selectedIds],
  );
  const normalizedIds = useMemo(
    () => normalizeComparisonIds(homes, selectedIds, 2),
    [homes, selectedIds],
  );

  const entries = useMemo<CompareEntry[]>(
    () =>
      selected
        .map((home) => {
          const scored = scoredHomes.find((entry) => entry.home.id === home.id);
          if (!scored) return null;
          return {
            home,
            score: scored.score,
            monthlyCost:
              scored.budgetEstimate.status === "partial"
                ? null
                : scored.monthlyCost,
            budgetStatus: scored.budgetEstimate.status,
            facts: scored.facts,
          };
        })
        .filter((entry): entry is CompareEntry => Boolean(entry)),
    [selected, scoredHomes],
  );

  const missingInfoRows = useMemo<EvaluationRow[]>(() => {
    if (!missingInfoFor || !activeWishlist) return [];
    const activeIds = new Set(
      activeRequirements.map((requirement) => requirement.id),
    );
    return getEvaluationRows(missingInfoFor, activeWishlist.id, true).filter(
      (row) => activeIds.has(row.requirement.id),
    );
  }, [
    activeRequirements,
    activeWishlist,
    getEvaluationRows,
    missingInfoFor,
  ]);

  const summary = useMemo(
    () =>
      buildComparisonSummary(
        entries.map((entry) => ({
          id: entry.home.id,
          address: entry.home.address,
          city: entry.home.city,
          score: entry.score,
          monthlyCost: entry.monthlyCost,
        })),
      ),
    [entries],
  );

  const activeName = activeWishlist
    ? translateWishlistName(activeWishlist.name, locale)
    : "";
  const scoredRequirements = activeRequirements.filter(isRequirementScoreable);
  const hasScoredRequirements = scoredRequirements.length > 0;
  const readyDrafts = activeRequirements.filter(isRequirementReadyToActivate);
  const configNeeded = activeRequirements.filter(
    (requirement) =>
      requirement.importance !== "ignore" &&
      !isRequirementComplete(requirement),
  );
  const draftRequirements = readyDrafts.length + configNeeded.length;
  const hasMustHaves = scoredRequirements.some(
    (requirement) => requirement.importance === "must",
  );
  const hasConfigurationGaps = activeRequirements.some(
    (requirement) =>
      requirement.importance !== "ignore" &&
      requirement.importance !== "dealbreaker" &&
      !isRequirementComplete(requirement),
  );
  const columns = Math.max(entries.length, 1);
  const scrolls = entries.length > 2 || homes.length > 2;
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `88px repeat(${columns}, minmax(136px, 1fr))`,
    minWidth: 88 + columns * 136,
  };

  async function activateReady() {
    if (readyDrafts.length === 0 || activateBusy) return;
    setActivateBusy(true);
    setActivateNotice("");
    const result = await activateRequirements(
      readyDrafts.map((requirement) => requirement.id),
    );
    setActivateBusy(false);
    if (!result.ok) {
      setActivateNotice(t("compare.activateError"));
      return;
    }
    setActivateNotice(
      result.count === 1
        ? t("compare.activatedOne")
        : t("compare.activated", { count: result.count }),
    );
  }

  function toggleSelected(homeId: string) {
    const next = toggleComparisonId(homes, selectedIds, homeId, 2);
    if (next.length === normalizedIds.length && !next.includes(homeId)) {
      setSelectionMessage(t("compare.atLeastTwo"));
      return;
    }
    setSelectionMessage("");
    setSelectedIds(next);
  }

  function selectAll() {
    setSelectionMessage("");
    setSelectedIds(homes.map((home) => home.id));
  }

  function submitNote(event: FormEvent) {
    event.preventDefault();
    if (!noteDraft.trim()) return;
    addComparisonNote(noteDraft);
    setNoteDraft("");
    setAddingNote(false);
  }

  function confirmRemove() {
    if (!pendingRemove) return;
    removeHome(pendingRemove.id);
    setPendingRemove(null);
  }

  function toggleSection(section: SectionId) {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  function renderRows(rows: Row[]) {
    return (
      <>
        {rows.map((row, rowIndex) => (
            <div
              key={row.label}
              className={[
                "grid items-stretch",
                rowIndex > 0 ? "border-t border-line/70" : "",
              ].join(" ")}
              style={gridStyle}
            >
              <div className="sticky left-0 z-10 border-r border-line/60 bg-cream/95 px-2.5 py-3 text-[10px] leading-[1.35] text-muted backdrop-blur">
                {row.label}
              </div>
              {entries.map((entry) => (
                <div
                  key={`${row.label}-${entry.home.id}`}
                  className="flex items-center justify-center border-l border-line/50 px-1.5 py-3 text-center text-[11px] tabular-nums text-ink/90"
                >
                  {row.render(entry)}
                </div>
              ))}
            </div>
        ))}
      </>
    );
  }

  function renderSection(id: SectionId, title: string, rows: Row[]) {
    const open = openSections[id];
    return (
      <section className="mt-5">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          aria-expanded={open}
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            {title}
          </span>
          <ChevronDownIcon
            className={[
              "h-4 w-4 text-muted transition-transform",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>
        {open && (
          <div className="mt-2 rounded-[20px] border border-line bg-white/45">
            {rows.length === 0 ? (
              <p className="px-4 py-5 text-center text-[10px] text-muted">
                {t("compare.noSelection")}
              </p>
            ) : (
              renderRows(rows)
            )}
          </div>
        )}
      </section>
    );
  }

  const matchRows: Row[] = [
    {
      label: t("compare.match"),
      render: (entry) =>
        entry.score.score === null || entry.score.disqualified ? (
          <span className="text-[10px] text-muted">
            {entry.score.disqualified
              ? "—"
              : t("compare.notEnough")}
          </span>
        ) : (
          <span className="font-serif text-[17px] leading-none text-ink">
            {entry.score.scoreRounded}%
          </span>
        ),
    },
    {
      label: t("compare.coverage"),
      render: (entry) => (
        <span className="text-[10px] tabular-nums text-muted">
          {Math.round(entry.score.coverage)}%
        </span>
      ),
    },
    {
      label: t("compare.mustMet"),
      render: (entry) =>
        entry.score.mustTotal === 0 ? (
          <span className="text-[9.5px] leading-4 text-muted">
            {hasScoredRequirements
              ? t("compare.noMustConfigured")
              : t("compare.setupRequired")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10.5px] tabular-nums text-ink/85">
            <CheckIcon className="h-3.5 w-3.5 text-olive" />
            {entry.score.mustMet.length}/{entry.score.mustTotal}
          </span>
        ),
    },
    {
      label: t("compare.mustMissing"),
      render: (entry) =>
        entry.score.mustMissing.length === 0 ? (
          <CheckIcon className="mx-auto h-4 w-4 text-olive" />
        ) : (
          <button
            type="button"
            onClick={() => setMustHavesFor(entry.home.id)}
            aria-label={t("compare.showMissing", {
              address: entry.home.address,
            })}
            className="inline-flex items-center gap-1 text-[10.5px] tabular-nums text-clay underline decoration-clay/30 underline-offset-2"
          >
            <XIcon className="h-3.5 w-3.5" />
            {entry.score.mustMissing.length}
          </button>
        ),
    },
    {
      label: t("compare.mustUnknown"),
      render: (entry) =>
        entry.score.mustUnknown.length === 0 ? (
          <CheckIcon className="mx-auto h-4 w-4 text-olive" />
        ) : (
          <span className="inline-flex items-center gap-1 text-[10.5px] tabular-nums text-muted">
            <QuestionIcon className="h-3.5 w-3.5" />
            {entry.score.mustUnknown.length}
          </span>
        ),
    },
    {
      label: t("compare.dealbreakers"),
      render: (entry) =>
        entry.score.disqualified ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-clay">
            <XIcon className="h-3.5 w-3.5" />
          </span>
        ) : entry.score.dealbreakersUnknown.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted">
            <QuestionIcon className="h-3.5 w-3.5" />
            {entry.score.dealbreakersUnknown.length}
          </span>
        ) : (
          <CheckIcon className="mx-auto h-4 w-4 text-olive" />
        ),
    },
    {
      label: t("compare.matchStatus"),
      render: (entry) => {
        const status = matchStatus(
          entry.score,
          hasScoredRequirements,
          hasConfigurationGaps,
        );
        return (
          <span
            className={`rounded-full px-2 py-0.5 text-[8.5px] uppercase tracking-[0.08em] ${matchStatusStyle(status)}`}
          >
            {t(matchStatusKey(status))}
          </span>
        );
      },
    },
    {
      label: t("compare.estimated"),
      render: (entry) => (
        <span className={`text-[9.5px] leading-4 ${statusTone(entry.score)}`}>
          {statusText(entry.score, t)}
        </span>
      ),
    },
  ];

  const detailRows: Row[] = [
    {
      label: t("common.bedrooms"),
      render: (entry) => (entry.home.beds > 0 ? entry.home.beds : "—"),
    },
    {
      label: t("common.bathrooms"),
      render: (entry) => (entry.home.baths > 0 ? entry.home.baths : "—"),
    },
    {
      label: t("common.squareFeet"),
      render: (entry) =>
        entry.home.sqft > 0
          ? entry.home.sqft.toLocaleString(locale === "es" ? "es-US" : "en-US")
          : "—",
    },
    {
      label: t("common.lotSize"),
      render: (entry) => formatLotLabel(entry.home.lot, locale) || "—",
    },
    {
      label: t("common.garage"),
      render: (entry) =>
        formatGarageLabel(entry.home.garage, locale) || "—",
    },
    {
      label: t("common.yearBuilt"),
      render: (entry) =>
        entry.home.yearBuilt > 0 ? entry.home.yearBuilt : "—",
    },
    {
      label: t("common.type"),
      render: (entry) =>
        translatePropertyType(entry.home.type, locale) || "—",
    },
    {
      label: t("common.pool"),
      render: (entry) => <BooleanCell value={fact(entry, "pool")} />,
    },
    {
      label: t("common.gated"),
      render: (entry) => <BooleanCell value={fact(entry, "gated")} />,
    },
  ];

  const financialRows: Row[] = [
    {
      label: t("budget.purchasePrice"),
      render: (entry) => formatPriceOrPending(entry.home.price, locale),
    },
    {
      label: t("common.hoaFee"),
      render: (entry) => {
        const value = fact(entry, "hoa");
        return typeof value === "number"
          ? formatPrice(value, locale)
          : entry.home.hoa > 0
            ? formatPrice(entry.home.hoa, locale)
            : "—";
      },
    },
    {
      label: t("compare.monthlyCost"),
      render: (entry) =>
        entry.monthlyCost === null ? (
          <span className="text-[9.5px] leading-4 text-muted">
            {t("compare.costUnavailable")}
          </span>
        ) : (
          <span className="text-[11px] tabular-nums text-ink/90">
            {formatPrice(Math.round(entry.monthlyCost), locale)}
          </span>
        ),
    },
    {
      label: t("compare.estimateStatus"),
      render: (entry) => (
        <span
          className={[
            "rounded-full px-2 py-0.5 text-[8.5px] uppercase tracking-[0.08em]",
            entry.budgetStatus === "partial"
              ? "bg-clay/10 text-clay"
              : entry.budgetStatus === "assumptions"
                ? "bg-gold/10 text-[#6b5535]"
                : "bg-olive/10 text-olive",
          ].join(" ")}
        >
          {entry.budgetStatus === "partial"
            ? t("compare.partialEstimate")
            : entry.budgetStatus === "assumptions"
              ? t("compare.assumptions")
              : t("budget.completeBadge")}
        </span>
      ),
    },
    {
      label: t("compare.openBudget"),
      render: (entry) => (
        <button
          type="button"
          onClick={() => onOpenBudget(entry.home.id)}
          className="min-h-9 rounded-full border border-olive/25 bg-olive/[0.06] px-3 text-[9.5px] font-medium text-olive"
        >
          {t("compare.openBudget")}
        </button>
      ),
    },
  ];

  const neighborhoodRows: Row[] = [
    {
      label: t("common.cityToConfirm"),
      render: (entry) => entry.home.city || "—",
    },
    {
      label: t("compare.floodZone"),
      render: (entry) => fact(entry, "floodZone") ?? "—",
    },
    {
      label: t("compare.walkScore"),
      render: (entry) => fact(entry, "walkScore") ?? "—",
    },
    {
      label: t("compare.schoolRating"),
      render: (entry) => fact(entry, "schoolRating") ?? "—",
    },
    {
      label: t("compare.commute"),
      render: (entry) => fact(entry, "commuteMinutes") ?? "—",
    },
  ];

  const communityRows: Row[] = [
    {
      label: t("common.gated"),
      render: (entry) => <BooleanCell value={fact(entry, "gated")} />,
    },
    {
      label: t("compare.communityGym"),
      render: (entry) => <BooleanCell value={fact(entry, "communityGym")} />,
    },
    {
      label: t("compare.playground"),
      render: (entry) => <BooleanCell value={fact(entry, "playground")} />,
    },
    {
      label: t("compare.clubhouse"),
      render: (entry) => <BooleanCell value={fact(entry, "clubhouse")} />,
    },
    {
      label: t("compare.fencedYard"),
      render: (entry) => <BooleanCell value={fact(entry, "fencedYard")} />,
    },
    {
      label: t("compare.coveredPatio"),
      render: (entry) => <BooleanCell value={fact(entry, "coveredPatio")} />,
    },
    {
      label: t("compare.outdoorKitchen"),
      render: (entry) => <BooleanCell value={fact(entry, "outdoorKitchen")} />,
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-6 pt-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
          {t("compare.eyebrow")}
        </p>
        <h1 className="mt-1 font-serif text-[31px] leading-none tracking-[-0.02em] text-ink">
          {t("compare.title")}
        </h1>
        {activeWishlist && (
          <p className="mt-2 text-[10px] text-muted">
            {t("compare.currentWishlist", { name: activeName })}
          </p>
        )}
      </header>

      {ready && !hasScoredRequirements && (
        <div className="mx-6 mt-4 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3.5">
          <p className="text-[12px] font-medium text-ink">
            {readyDrafts.length > 0
              ? t("compare.activateReadyTitle")
              : configNeeded.length > 0
                ? t("compare.statusConfigNeeded")
                : t("compare.noConfiguredTitle")}
          </p>
          <p className="mt-1 text-[10.5px] leading-4 text-muted">
            {readyDrafts.length > 0
              ? t("compare.activateReadyBody")
              : configNeeded.length > 0
                ? t("compare.configIssue.missing-expected")
                : t("compare.noConfiguredBody")}
          </p>
          {draftRequirements > 0 && (
            <p className="mt-1.5 inline-flex rounded-full bg-white/70 px-2.5 py-1 text-[9.5px] font-medium text-[#6b5535]">
              {t("compare.draftCount", { count: draftRequirements })}
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap gap-2">
            {readyDrafts.length > 0 && (
              <button
                type="button"
                onClick={activateReady}
                disabled={activateBusy}
                className="inline-flex min-h-9 items-center rounded-full bg-olive px-3 text-[10px] font-medium text-cream disabled:opacity-50"
              >
                {readyDrafts.length === 1
                  ? t("compare.activateReadyOne")
                  : t("compare.activateReadyButton", {
                      count: readyDrafts.length,
                    })}
              </button>
            )}
            <button
              type="button"
              onClick={onOpenWishlist}
              className="inline-flex min-h-9 items-center rounded-full border border-olive/25 bg-white/70 px-3 text-[10px] font-medium text-olive"
            >
              {t("compare.reviewWishlist")}
            </button>
          </div>
          {activateNotice && (
            <p
              role="status"
              className={[
                "mt-2 text-[10px]",
                activateNotice === t("compare.activateError")
                  ? "text-clay"
                  : "text-olive",
              ].join(" ")}
            >
              {activateNotice}
            </p>
          )}
        </div>
      )}

      {hasScoredRequirements && !hasMustHaves && (
        <p className="mx-6 mt-4 rounded-2xl border border-line bg-parchment/70 px-4 py-2.5 text-[10px] leading-4 text-muted">
          {t("compare.noMustNotice")}
        </p>
      )}

      {pendingRemove && (
        <div
          role="alertdialog"
          aria-label={t("common.removeAddress", {
            address: pendingRemove.address,
          })}
          className="mx-6 mt-4 rounded-2xl border border-line bg-parchment px-4 py-3.5"
        >
          <p className="text-[12px] font-medium leading-5 text-ink">
            {t("compare.removeConfirmTitle", {
              address: pendingRemove.address,
            })}
          </p>
          <p className="mt-1 text-[10.5px] leading-4 text-muted">
            {t("compare.removeConfirmBody")}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              autoFocus
              onClick={() => setPendingRemove(null)}
              className="min-h-10 flex-1 rounded-full border border-line bg-white/70 text-[11px] font-medium text-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
            >
              {t("common.keepHome")}
            </button>
            <button
              type="button"
              onClick={confirmRemove}
              className="min-h-10 flex-1 rounded-full bg-clay text-[11px] font-medium text-cream transition-colors hover:bg-clay/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
            >
              {t("common.remove")}
            </button>
          </div>
        </div>
      )}

      <div className="px-6 pb-9 pt-5">
        {homes.length === 0 ? (
          <div className="rounded-[20px] border border-line bg-white/45 px-5 py-10 text-center">
            <p className="font-serif text-[19px] leading-tight text-ink">
              {t("compare.emptyTitle")}
            </p>
            <p className="mt-2 text-[11.5px] leading-5 text-muted">
              {t("compare.emptyBody")}
            </p>
            <button
              type="button"
              onClick={onAddHome}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-olive px-4 py-2.5 text-[11px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {t("add.addHome")}
            </button>
          </div>
        ) : (
          <>
            <section className="rounded-[22px] border border-line bg-parchment/70 px-4 py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                  {t("compare.selectProperties")}
                </p>
                <span className="text-[9.5px] tabular-nums text-muted">
                  {t("compare.showing", {
                    selected: normalizedIds.length,
                    total: homes.length,
                  })}
                </span>
              </div>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {homes.map((home) => {
                  const isSelected = normalizedIds.includes(home.id);
                  return (
                    <button
                      key={home.id}
                      type="button"
                      onClick={() => toggleSelected(home.id)}
                      aria-pressed={isSelected}
                      className={[
                        "min-h-10 shrink-0 rounded-full border px-3 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40",
                        isSelected
                          ? "border-olive bg-olive font-medium text-cream"
                          : "border-line bg-white/60 text-muted hover:text-ink",
                      ].join(" ")}
                    >
                      {home.address}
                    </button>
                  );
                })}
                {homes.length > 2 && (
                  <button
                    type="button"
                    onClick={selectAll}
                    className="min-h-10 shrink-0 rounded-full border border-dashed border-olive/30 px-3 text-[10px] text-olive"
                  >
                    {t("compare.all")}
                  </button>
                )}
              </div>
              <p className="mt-1 text-[9.5px] leading-4 text-muted">
                {t("compare.selectHint")}
              </p>
              {selectionMessage && (
                <p role="status" className="mt-1 text-[9.5px] text-gold">
                  {selectionMessage}
                </p>
              )}
            </section>

            <section className="mt-4 rounded-[24px] bg-olive p-5 text-cream">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-cream/75">
                  {t("compare.summary")}
                </p>
                <span className="rounded-full bg-cream/10 px-2 py-0.5 text-[8.5px] uppercase tracking-[0.1em] text-cream/80">
                  {activeName}
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-4 text-cream/80">
                {t("compare.summaryHint")}
              </p>

              <ul className="mt-4 space-y-2.5">
                {summary.highestScore?.score.score !== null &&
                  summary.highestScore?.score.score !== undefined && (
                  <SummaryLine tone="cream">
                    {t("compare.highestScore", {
                      wishlist: activeName,
                      address: summary.highestScore.address,
                      percent: summary.highestScore.score.scoreRounded ?? 0,
                      coverage: Math.round(
                        summary.highestScore.score.coverage,
                      ),
                    })}
                  </SummaryLine>
                )}

                {summary.lowestCost?.monthlyCost !== undefined &&
                  summary.lowestCost?.monthlyCost !== null && (
                  <SummaryLine tone="cream">
                    {t("compare.lowestCost", {
                      address: summary.lowestCost.address,
                      amount: formatPrice(
                        Math.round(summary.lowestCost.monthlyCost),
                        locale,
                      ),
                    })}
                  </SummaryLine>
                )}

                {summary.mostMustHaves &&
                  summary.mostMustHaves.score.mustMet.length > 0 && (
                    <SummaryLine tone="cream">
                      {t("compare.mostMust", {
                        address: summary.mostMustHaves.address,
                        count: summary.mostMustHaves.score.mustMet.length,
                      })}
                    </SummaryLine>
                  )}

                {summary.missingMustHaves.map((candidate) => (
                  <SummaryLine
                    key={`must-${candidate.id}`}
                    tone="clay"
                    onClick={() => setMustHavesFor(candidate.id)}
                  >
                    {t("compare.missingMust", {
                      address: candidate.address,
                      count: candidate.score.mustMissing.length,
                    })}
                  </SummaryLine>
                ))}

                {summary.disqualified.length === 0 &&
                  summary.missingMustHaves.length === 0 && (
                    <SummaryLine tone="cream">
                      {t("compare.noDealbreakers")}
                    </SummaryLine>
                  )}
                {summary.disqualified.map((candidate) => (
                  <SummaryLine key={`bad-${candidate.id}`} tone="clay">
                    {t("compare.disqualified", { address: candidate.address })}
                  </SummaryLine>
                ))}
                {summary.insufficient.slice(0, 3).map((candidate) => (
                  <SummaryLine
                    key={`insufficient-${candidate.id}`}
                    tone="muted"
                    onClick={() => setMissingInfoFor(candidate.id)}
                  >
                    {t("compare.insufficientInfo", {
                      address: candidate.address,
                    })}
                  </SummaryLine>
                ))}
                {summary.missingInformation.slice(0, 3).map((candidate) => (
                  <SummaryLine
                    key={`info-${candidate.id}`}
                    tone="muted"
                    onClick={() => setMissingInfoFor(candidate.id)}
                  >
                    {t("compare.missingInfo", {
                      address: candidate.address,
                      percent: Math.round(candidate.score.coverage),
                    })}
                  </SummaryLine>
                ))}
                {summary.highestScore === null &&
                  summary.disqualified.length === 0 &&
                  summary.insufficient.length === 0 &&
                  summary.missingInformation.length === 0 && (
                    <SummaryLine tone="muted">
                      {t("compare.noEligible")}
                    </SummaryLine>
                  )}
              </ul>
            </section>

            <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white/45">
              <button
                type="button"
                onClick={() => setNotesOpen((value) => !value)}
                aria-expanded={notesOpen}
                className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-olive/30"
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                  {notesOpen
                    ? t("compare.notesHide")
                    : t("compare.notesShow", {
                        count: comparisonNotes.length,
                      })}
                </span>
                <ChevronDownIcon
                  className={[
                    "h-4 w-4 text-muted transition-transform",
                    notesOpen ? "rotate-180" : "",
                  ].join(" ")}
                />
              </button>
              {notesOpen && (
                <div className="border-t border-line/70 px-4 py-3">
                  {comparisonNotes.length === 0 ? (
                    <p className="text-[10.5px] leading-4 text-muted">
                      {t("compare.noNotes")}
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {comparisonNotes.map((note) => (
                        <li
                          key={note.id}
                          className="text-[11px] leading-4 text-ink/85"
                        >
                          {note.body}
                        </li>
                      ))}
                    </ul>
                  )}

                  {addingNote ? (
                    <form
                      onSubmit={submitNote}
                      className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-white/70 p-1.5 pl-3"
                    >
                      <input
                        autoFocus
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        placeholder={t("compare.notePlaceholder")}
                        aria-label={t("compare.noteAria")}
                        className="min-w-0 flex-1 bg-transparent text-[11.5px] text-ink outline-none placeholder:text-muted"
                      />
                      <button
                        type="submit"
                        className="min-h-8 rounded-full bg-olive px-3 text-[9.5px] font-medium text-cream"
                      >
                        {t("common.add")}
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingNote(true)}
                      className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 text-[10px] font-medium text-olive"
                    >
                      <PlusIcon className="h-3 w-3" />
                      {t("compare.addNote")}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 overflow-x-auto pb-1">
              <div style={{ minWidth: 88 + columns * 136 }}>
              <div className="grid" style={gridStyle}>
                <div className="sticky left-0 z-20 bg-cream/95 backdrop-blur" />
                {entries.map((entry) => (
                  <div key={entry.home.id} className="relative min-w-0 px-1">
                    <button
                      type="button"
                      onClick={() => onOpenProperty(entry.home.id)}
                      title={entry.home.address}
                      className="block w-full pb-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
                    >
                      <div className="relative h-[82px] w-full overflow-hidden rounded-xl border border-line/80">
                        <PropertyPhoto
                          home={entry.home}
                          className="h-full w-full"
                        />
                        <span
                          className={[
                            "absolute bottom-1 left-1 rounded-full px-1.5 py-0.5 text-[8px] font-medium backdrop-blur",
                            entry.score.disqualified
                              ? "bg-clay/95 text-cream"
                              : entry.score.score === null
                                ? "bg-cream/95 text-muted"
                                : "bg-cream/95 text-olive",
                          ].join(" ")}
                        >
                          {entry.score.disqualified
                            ? t("property.dealbreaker")
                            : entry.score.score === null
                              ? t("compare.notEnough")
                              : t("compare.matchBadge", {
                                  percent: entry.score.scoreRounded ?? 0,
                                })}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[11px] font-medium leading-[1.2] text-ink">
                        {entry.home.address}
                      </p>
                      <p className="mt-0.5 truncate text-[9px] text-muted">
                        {entry.home.city || "—"}
                      </p>
                      <p className="mt-1 whitespace-nowrap text-[9.5px] text-muted">
                        {formatPriceOrPending(entry.home.price, locale)}
                      </p>
                    </button>

                    <div className="flex items-center justify-center gap-1.5 pb-1">
                      <span className="text-[8.5px] text-muted">
                        {t("compare.coverageShort", {
                          percent: Math.round(entry.score.coverage),
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingRemove({
                            id: entry.home.id,
                            address: entry.home.address,
                          })
                        }
                        aria-label={t("common.removeAddressFromComparison", {
                          address: entry.home.address,
                        })}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white/70 text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {(entry.score.score === null ||
                      entry.score.mustUnknown.length > 0 ||
                      entry.score.coverage < 100 ||
                      entry.score.dealbreakersUnknown.length > 0 ||
                      hasConfigurationGaps) && (
                      <button
                        type="button"
                        onClick={() => setMissingInfoFor(entry.home.id)}
                        className="mb-3 w-full rounded-full border border-olive/25 bg-olive/[0.06] px-1.5 py-1.5 text-[8px] font-medium leading-3 text-olive"
                      >
                        {t("compare.viewMissing")}
                      </button>
                    )}
                  </div>
                ))}
              </div>

            <p className="mt-2 text-center text-[10px] text-muted">
              {scrolls ? t("compare.swipeHint") : t("compare.tapHint")}
            </p>

            {renderSection("match", t("compare.sectionMatch"), matchRows)}
            {renderSection("details", t("compare.sectionDetails"), detailRows)}
            {renderSection("financial", t("compare.sectionFinancial"), financialRows)}
            {renderSection("neighborhood", t("compare.sectionNeighborhood"), neighborhoodRows)}
            {renderSection("community", t("compare.sectionCommunity"), communityRows)}

              <p className="mt-4 text-center text-[9.5px] leading-4 text-muted">
                {t("budget.estimateNote")}
              </p>
              </div>
            </div>
          </>
        )}
      </div>

      <MustHavesSheet
        open={Boolean(mustHavesFor)}
        entry={entries.find((entry) => entry.home.id === mustHavesFor) ?? null}
        onClose={() => setMustHavesFor(null)}
        onEvaluate={(homeId) => {
          setMustHavesFor(null);
          onEvaluate(homeId);
        }}
      />

      <MissingInfoSheet
        open={Boolean(missingInfoFor)}
        entry={entries.find((entry) => entry.home.id === missingInfoFor) ?? null}
        rows={missingInfoRows}
        hasScoreableRequirements={hasScoredRequirements}
        wishlistName={activeName}
        requirementCount={
          activeRequirements.filter(
            (requirement) => requirement.importance !== "ignore",
          ).length
        }
        onClose={() => setMissingInfoFor(null)}
        onOpenWishlist={() => {
          setMissingInfoFor(null);
          onOpenWishlist();
        }}
        onEditRequirement={(requirementId) => {
          setMissingInfoFor(null);
          onOpenRequirement(requirementId);
        }}
        onActivate={activateRequirements}
        onSaveFact={(featureKey, value) =>
          missingInfoFor
            ? saveHomeFact(missingInfoFor, featureKey, value)
            : Promise.resolve({ ok: false, shared: false })
        }
        onEditProperty={(homeId, featureKey) => {
          setMissingInfoFor(null);
          onEditProperty(homeId, featureKey);
        }}
        onEvaluate={(homeId) => {
          setMissingInfoFor(null);
          onEvaluate(homeId);
        }}
      />
    </div>
  );
}

function SummaryLine({
  children,
  tone,
  onClick,
}: {
  children: ReactNode;
  tone: "cream" | "clay" | "muted";
  onClick?: () => void;
}) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className={[
          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
          tone === "clay"
            ? "bg-[#e0a294]"
            : tone === "muted"
              ? "bg-cream/35"
              : "bg-cream/70",
        ].join(" ")}
      />
      <span
        className={[
          "text-[11px] leading-[1.55]",
          tone === "clay"
            ? "text-[#f0c9c0]"
            : tone === "muted"
              ? "text-cream/80"
              : "text-cream/90",
          onClick ? "underline decoration-cream/30 underline-offset-2" : "",
        ].join(" ")}
      >
        {children}
      </span>
    </>
  );

  return (
    <li>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-start gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/40"
        >
          {content}
        </button>
      ) : (
        <div className="flex items-start gap-2.5">{content}</div>
      )}
    </li>
  );
}

function factKind(requirement: WishlistRequirement) {
  const feature = FEATURE_BY_KEY[requirement.featureKey];
  if (feature) return feature.kind;
  if (requirement.type === "yes") return "boolean";
  if (
    requirement.type === "min" ||
    requirement.type === "max" ||
    requirement.type === "range"
  ) {
    return "number";
  }
  return "text";
}

function InlineFactEditor({
  kind,
  label,
  onSave,
}: {
  kind: "number" | "boolean";
  label: string;
  onSave: (value: FactValue) => Promise<boolean>;
}) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [choice, setChoice] = useState("unknown");
  const [busy, setBusy] = useState(false);

  if (kind === "boolean") {
    return (
      <div className="mt-1.5">
        <select
          value={choice}
          aria-label={label}
          disabled={busy}
          onChange={async (event) => {
            const next = event.target.value;
            if (next === "unknown") return;
            setChoice(next);
            setBusy(true);
            const ok = await onSave(next === "yes");
            setBusy(false);
            if (!ok) setChoice("unknown");
          }}
          className="min-h-10 w-full rounded-xl border border-line bg-white/75 px-3 text-[11px] text-ink outline-none focus:border-olive/35 focus:ring-2 focus:ring-olive/15 disabled:opacity-60"
        >
          <option value="unknown">{t("common.notSure")}</option>
          <option value="yes">{t("common.yes")}</option>
          <option value="no">{t("common.no")}</option>
        </select>
      </div>
    );
  }

  const parsed = Number(text.replace(",", "."));
  const valid = text.trim() !== "" && Number.isFinite(parsed);

  async function save() {
    if (!valid || busy) return;
    setBusy(true);
    const ok = await onSave(parsed);
    setBusy(false);
    if (ok) setText("");
  }

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <input
        value={text}
        aria-label={label}
        inputMode="decimal"
        placeholder={t("compare.enterValue")}
        disabled={busy}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void save();
          }
        }}
        className="min-h-10 min-w-0 flex-1 rounded-xl border border-line bg-white/75 px-3 text-[11px] tabular-nums text-ink outline-none placeholder:text-muted/50 focus:border-olive/35 focus:ring-2 focus:ring-olive/15 disabled:opacity-60"
      />
      <button
        type="button"
        onClick={() => void save()}
        disabled={!valid || busy}
        className="min-h-10 shrink-0 rounded-full bg-olive px-3 text-[10px] font-medium text-cream disabled:opacity-40"
      >
        {t("common.save")}
      </button>
    </div>
  );
}

function configIssueText(
  issue: NonNullable<EvaluationRow["configIssue"]>,
  t: ReturnType<typeof useI18n>["t"],
) {
  switch (issue) {
    case "missing-feature":
      return t("compare.configIssue.missing-feature");
    case "missing-operator":
      return t("compare.configIssue.missing-operator");
    case "invalid-expected":
      return t("compare.configIssue.invalid-expected");
    default:
      return t("compare.configIssue.missing-expected");
  }
}

function MissingInfoSheet({
  open,
  entry,
  rows,
  hasScoreableRequirements,
  wishlistName,
  requirementCount,
  onClose,
  onOpenWishlist,
  onEditProperty,
  onEditRequirement,
  onActivate,
  onSaveFact,
  onEvaluate,
}: {
  open: boolean;
  entry: CompareEntry | null;
  rows: EvaluationRow[];
  hasScoreableRequirements: boolean;
  wishlistName: string;
  requirementCount: number;
  onClose: () => void;
  onOpenWishlist: () => void;
  onEditProperty: (homeId: string, featureKey?: string) => void;
  onEditRequirement: (requirementId: string) => void;
  onActivate: (
    requirementIds: string[],
  ) => Promise<{ ok: boolean; count: number; error?: string }>;
  onSaveFact: (
    featureKey: string,
    value: FactValue,
  ) => Promise<{ ok: boolean; shared: boolean }>;
  onEvaluate: (homeId: string) => void;
}) {
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [factNotice, setFactNotice] = useState("");
  if (!entry) return null;

  const hasConfigurationGaps = rows.some(
    (row) =>
      row.configIssue &&
      row.requirement.importance !== "dealbreaker",
  );
  const status = matchStatus(
    entry.score,
    hasScoreableRequirements,
    hasConfigurationGaps,
  );
  const groups = (
    [
      { id: "must", label: t("compare.groupMust"), items: [] as EvaluationRow[] },
      { id: "nice", label: t("compare.groupNice"), items: [] as EvaluationRow[] },
      {
        id: "dealbreaker",
        label: t("compare.groupDealbreakers"),
        items: [] as EvaluationRow[],
      },
    ]
  ).map((group) => ({
    ...group,
    items: rows.filter(
      (row) => row.requirement.importance === group.id,
    ),
  }));

  const readyIds = rows
    .filter(
      (row) =>
        !row.configIssue && row.requirement.configured === false,
    )
    .map((row) => row.requirement.id);

  async function activate(ids: string[]) {
    if (ids.length === 0 || busy) return;
    setBusy(true);
    setMessage("");
    const result = await onActivate(ids);
    setBusy(false);
    if (!result.ok) {
      setMessage(t("compare.activateError"));
      return;
    }
    setMessage(
      result.count === 1
        ? t("compare.activatedOne")
        : t("compare.activated", { count: result.count }),
    );
  }

  async function saveFact(featureKey: string, value: FactValue) {
    setFactNotice("");
    const result = await onSaveFact(featureKey, value);
    setFactNotice(
      result.ok
        ? result.shared
          ? t("compare.factSavedShared")
          : t("compare.factSavedDevice")
        : t("compare.factSaveError"),
    );
    return result.ok;
  }

  return (
    <Sheet
      open={open}
      title={t("compare.missingInformationTitle", {
        address: entry.home.address,
      })}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEditProperty(entry.home.id)}
            className="min-h-11 flex-1 rounded-full border border-line bg-white/70 px-3 text-[11px] font-medium text-ink"
          >
            {t("compare.editProperty")}
          </button>
          <button
            type="button"
            onClick={() => onEvaluate(entry.home.id)}
            className="min-h-11 flex-1 rounded-full bg-olive px-3 text-[11px] font-medium text-cream"
          >
            {t("compare.evaluateHome")}
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[8.5px] uppercase tracking-[0.08em] ${matchStatusStyle(status)}`}
        >
          {t(matchStatusKey(status))}
        </span>
        <span className="text-[10px] tabular-nums text-muted">
          {t("compare.coverageShort", {
            percent: Math.round(entry.score.coverage),
          })}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="min-w-0 text-[9.5px] leading-4 text-muted">
          {t("compare.fromWishlist", {
            name: wishlistName,
            count: requirementCount,
          })}
        </p>
        <button
          type="button"
          onClick={onOpenWishlist}
          className="min-h-8 shrink-0 rounded-full border border-line bg-white/70 px-2.5 text-[9px] font-medium text-olive"
        >
          {t("compare.changeWishlist")}
        </button>
      </div>

      {readyIds.length > 0 && (
        <div className="mt-3 rounded-2xl border border-olive/20 bg-olive/[0.05] px-3.5 py-3">
          <p className="text-[10px] leading-4 text-ink">
            {t("compare.activateReadyTitle")} {t("compare.activateReadyBody")}
          </p>
          <button
            type="button"
            onClick={() => activate(readyIds)}
            disabled={busy}
            className="mt-2 min-h-9 rounded-full bg-olive px-3 text-[10px] font-medium text-cream disabled:opacity-50"
          >
            {readyIds.length === 1
              ? t("compare.activateReadyOne")
              : t("compare.activateReadyButton", { count: readyIds.length })}
          </button>
        </div>
      )}

      {message && (
        <p
          role="status"
          className={[
            "mt-2 text-[10px]",
            message === t("compare.activateError") ? "text-clay" : "text-olive",
          ].join(" ")}
        >
          {message}
        </p>
      )}

      {factNotice && (
        <p
          role="status"
          className={[
            "mt-2 text-[10px]",
            factNotice === t("compare.factSaveError")
              ? "text-clay"
              : "text-olive",
          ].join(" ")}
        >
          {factNotice}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-line bg-parchment/60 px-4 py-4">
          <p className="text-[12px] font-medium text-ink">
            {t("compare.noRequirementsTitle")}
          </p>
          <p className="mt-1 text-[10.5px] leading-4 text-muted">
            {t("compare.noRequirementsBody")}
          </p>
        </div>
      ) : (
        groups
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <section key={group.id} className="mt-4">
              <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted">
                {group.label} · {group.items.length}
              </p>
              <ul className="mt-2 space-y-2">
                {group.items.map((row) => {
                  const complete = row.configIssue === null;
                  const configured = row.requirement.configured !== false;
                  const displayStatus = requirementDisplayStatus({
                    complete,
                    configured,
                    resolved: row.resolved,
                  });
                  const kind = factKind(row.requirement);
                  const inlineKind =
                    kind === "number" || kind === "boolean" ? kind : null;
                  const canEditInline =
                    inlineKind !== null &&
                    !row.configIssue &&
                    configured &&
                    row.resolved === "unknown" &&
                    row.requirement.featureKey !== "monthlyOwnershipCost";
                  const requirementName = translateRequirementName(
                    row.requirement.name,
                    locale,
                    Boolean(row.requirement.custom),
                  );
                  return (
                    <li
                      key={row.requirement.id}
                      className="rounded-2xl border border-line/80 bg-white/60 px-3.5 py-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 text-[11.5px] font-medium leading-4 text-ink">
                          {requirementName}
                        </p>
                        <span
                          className={`max-w-[58%] shrink-0 whitespace-normal rounded-full px-2 py-0.5 text-right text-[8px] uppercase leading-[1.35] tracking-[0.06em] ${requirementStatusStyle(displayStatus)}`}
                        >
                          {t(requirementStatusKey(displayStatus))}
                        </span>
                      </div>

                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                        <div>
                          <dt className="text-[8.5px] uppercase tracking-[0.1em] text-muted">
                            {t("compare.requiredCondition")}
                          </dt>
                          <dd className="mt-0.5 text-[10.5px] leading-4 text-ink">
                            {requiredCondition(row.requirement, locale, t)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[8.5px] uppercase tracking-[0.1em] text-muted">
                            {t("compare.knownValue")}
                          </dt>
                          <dd className="mt-0.5 text-[10.5px] leading-4 text-ink">
                            {factValueLabel(
                              row.actual,
                              row.requirement.featureKey,
                              locale,
                              t,
                            )}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-2 border-t border-line/60 pt-2">
                        {canEditInline && inlineKind ? (
                          <>
                            <p className="text-[9.5px] leading-4 text-muted">
                              {t("compare.actionAddDetails")}
                            </p>
                            <InlineFactEditor
                              kind={inlineKind}
                              label={requirementName}
                              onSave={(value) =>
                                saveFact(
                                  row.requirement.featureKey,
                                  value,
                                )
                              }
                            />
                          </>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <p className="min-w-0 text-[9.5px] leading-4 text-muted">
                              {row.configIssue
                                ? configIssueText(row.configIssue, t)
                                : !configured
                                  ? row.automatic === "met"
                                    ? t("compare.readyWouldMeet")
                                    : row.automatic === "not-met"
                                      ? t("compare.readyWouldNotMeet")
                                      : t("compare.statusReady")
                                  : row.resolved === "unknown"
                                    ? t("compare.actionAddDetails")
                                    : t("compare.actionNone")}
                            </p>
                            {row.configIssue ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onEditRequirement(row.requirement.id)
                                }
                                className="min-h-8 shrink-0 rounded-full border border-olive/25 bg-white/70 px-2.5 text-[9px] font-medium text-olive"
                              >
                                {t("compare.actionEditRequirement")}
                              </button>
                            ) : !configured ? (
                              <button
                                type="button"
                                onClick={() =>
                                  activate([row.requirement.id])
                                }
                                disabled={busy}
                                className="min-h-8 shrink-0 rounded-full border border-olive/25 bg-white/70 px-2.5 text-[9px] font-medium text-olive disabled:opacity-50"
                              >
                                {t("compare.actionActivate")}
                              </button>
                            ) : row.resolved === "unknown" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onEditProperty(
                                    entry.home.id,
                                    row.requirement.featureKey,
                                  )
                                }
                                className="min-h-8 shrink-0 rounded-full border border-olive/25 bg-white/70 px-2.5 text-[9px] font-medium text-olive"
                              >
                                {t("compare.addDetails")}
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
      )}
    </Sheet>
  );
}

function MustHavesSheet({
  open,
  entry,
  onClose,
  onEvaluate,
}: {
  open: boolean;
  entry: CompareEntry | null;
  onClose: () => void;
  onEvaluate: (homeId: string) => void;
}) {
  const { t, locale } = useI18n();
  if (!entry) return null;

  const groups = [
    {
      key: "missing",
      label: t("compare.missingSection"),
      items: entry.score.mustMissing,
      Icon: XIcon,
      tone: "text-clay",
    },
    {
      key: "unknown",
      label: t("compare.awaitingSection"),
      items: entry.score.mustUnknown,
      Icon: QuestionIcon,
      tone: "text-muted",
    },
    {
      key: "met",
      label: t("compare.metSection"),
      items: entry.score.mustMet,
      Icon: CheckIcon,
      tone: "text-olive",
    },
  ];

  return (
    <Sheet
      open={open}
      title={t("compare.mustHavesFor", { address: entry.home.address })}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={() => onEvaluate(entry.home.id)}
          className="min-h-11 w-full rounded-full bg-olive px-4 text-[12px] font-medium text-cream"
        >
          {t("compare.evaluateHome")}
        </button>
      }
    >
      {groups.map((group) => (
        <section key={group.key} className="mb-4 last:mb-0">
          <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted">
            {group.label} · {group.items.length}
          </p>
          {group.items.length === 0 ? (
            <p className="mt-1 text-[10px] text-muted">—</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {group.items.map((requirement) => (
                <li
                  key={requirement.id}
                  className="flex items-start gap-2.5 rounded-xl border border-line/70 bg-white/55 px-3 py-2.5"
                >
                  <group.Icon
                    className={["mt-0.5 h-3.5 w-3.5 shrink-0", group.tone].join(
                      " ",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11.5px] font-medium leading-4 text-ink">
                      {translateRequirementName(
                        requirement.name,
                        locale,
                        Boolean(requirement.custom),
                      )}
                    </span>
                    <span className="mt-0.5 block text-[9.5px] text-muted">
                      {t(
                        `importance.${requirement.importance}` as Parameters<
                          typeof t
                        >[0],
                      )}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </Sheet>
  );
}
