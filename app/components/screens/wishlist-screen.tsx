"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useAppData } from "../../lib/app-data";
import { formatPrice } from "../../lib/homes";
import {
  categoryKey,
  importanceKey,
  translateRequirementName,
  translateWishlistName,
  useI18n,
  type TranslationKey,
} from "../../lib/i18n";
import type {
  Importance,
  PropertyEvaluation,
  Wishlist,
  WishlistRequirement,
} from "../../lib/v2-types";
import {
  isRequirementComplete,
  isRequirementReadyToActivate,
} from "../../lib/requirement-config";
import { groupByCategory, wishlistSetupProgress } from "../../lib/wishlists";
import { BackButton } from "../back-button";
import { HouseIllustration } from "../house-illustration";
import { Sheet } from "../sheet";
import { RequirementEditor } from "../wishlist-requirement-editor";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "../icons";

type Filter = "must" | "nice" | "dealbreaker" | "all";
type ViewMode = "priority" | "category";

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
      <div
        className="h-full rounded-full bg-olive transition-[width] duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function expectedLabel(
  requirement: WishlistRequirement,
  locale: "en" | "es",
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
) {
  const value = requirement.expectedValue;
  const currency =
    requirement.featureKey === "price" ||
    requirement.featureKey === "monthlyOwnershipCost" ||
    requirement.featureKey === "hoa";

  if (requirement.type === "yes") {
    return value === true ? t("common.yes") : t("common.no");
  }
  if (requirement.type === "range" && value && typeof value === "object") {
    const range = value as { min?: number; max?: number };
    return `${range.min ?? "?"} – ${range.max ?? "?"}`;
  }
  if (typeof value === "number") {
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

function ImportanceBadge({
  importance,
}: {
  importance: WishlistRequirement["importance"];
}) {
  const { t } = useI18n();
  const styles =
    importance === "must"
      ? "border-olive/25 bg-olive/[0.08] text-olive"
      : importance === "dealbreaker"
        ? "border-clay/30 bg-clay/[0.08] text-clay"
        : importance === "nice"
          ? "border-gold/30 bg-gold/[0.08] text-[#6b5535]"
          : "border-line bg-parchment text-muted";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[8.5px] uppercase tracking-[0.08em] ${styles}`}
    >
      {t(importanceKey(importance))}
    </span>
  );
}

function PriorityRow({
  requirement,
  onEdit,
  manageMode = false,
  selected = false,
  onToggle,
}: {
  requirement: WishlistRequirement;
  onEdit: () => void;
  manageMode?: boolean;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const { t, locale } = useI18n();
  const expected = expectedLabel(requirement, locale, t);
  const name = translateRequirementName(
    requirement.name,
    locale,
    Boolean(requirement.custom),
  );

  return (
    <article className="flex items-start gap-3 px-4 py-3">
      {manageMode && (
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label={t("wishlist.selectAria", { name })}
          onClick={onToggle}
          className={[
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40",
            selected
              ? "border-olive bg-olive text-cream"
              : "border-line bg-white/70 text-transparent",
          ].join(" ")}
        >
          <CheckIcon className="h-3.5 w-3.5" />
        </button>
      )}
      <span
        aria-hidden="true"
        className={[
          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
          requirement.importance === "must"
            ? "bg-olive"
            : requirement.importance === "nice"
              ? "bg-gold"
              : requirement.importance === "dealbreaker"
                ? "bg-clay"
                : "bg-muted/40",
        ].join(" ")}
      />
      <div className="min-w-0 flex-1">
        <p
          className={[
            "text-[12.5px] leading-4",
            requirement.configured ? "text-ink" : "text-muted",
          ].join(" ")}
        >
          {name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[9.5px] text-muted">
          {expected !== "—" && (
            <>
              <span className="tabular-nums">{expected}</span>
              <span aria-hidden="true" className="text-muted/60">
                ·
              </span>
            </>
          )}
          <span>{t(categoryKey(requirement.category))}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <ImportanceBadge importance={requirement.importance} />
          {!requirement.configured && (
            <span className="rounded-full border border-line bg-parchment px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] text-muted">
              {t("wishlist.draft")}
            </span>
          )}
          {!isRequirementComplete(requirement) && (
            <span className="rounded-full border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] text-[#6b5535]">
              {t("wishlist.configNeeded")}
            </span>
          )}
        </div>
      </div>
      {!manageMode && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={t("wishlist.editAria", { name })}
          className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-line bg-white/70 px-2.5 text-[9.5px] font-medium text-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
        >
          <PencilIcon className="h-3 w-3 text-olive" />
          {t("common.edit")}
        </button>
      )}
    </article>
  );
}

export function WishlistScreen({
  onBack,
  onBrowseHomes,
  focusRequirementId = null,
}: {
  onBack: () => void;
  onBrowseHomes: () => void;
  focusRequirementId?: string | null;
}) {
  const {
    wishlists,
    requirements,
    activeWishlist,
    activeRequirements,
    setActiveWishlist,
    createWishlist,
    renameWishlist,
    duplicateWishlist,
    deleteWishlist,
    updateWishlistBudget,
    v2Synced,
    evaluationsSynced,
    accountSynced,
    accountSyncError,
    bulkSetImportance,
    bulkRemoveRequirements,
    restoreRequirements,
    activateRequirements,
    ready,
  } = useAppData();
  const { t, locale } = useI18n();

  const initialFocus = focusRequirementId
    ? requirements.find(
        (requirement) => requirement.id === focusRequirementId,
      ) ?? null
    : null;

  const [editorOpen, setEditorOpen] = useState(Boolean(initialFocus));
  const [editing, setEditing] = useState<WishlistRequirement | null>(
    initialFocus,
  );
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("priority");
  const [filter, setFilter] = useState<Filter>(
    initialFocus && initialFocus.importance !== "ignore"
      ? initialFocus.importance
      : "must",
  );
  const [manageOpen, setManageOpen] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkNotice, setBulkNotice] = useState("");
  const [undoBatch, setUndoBatch] = useState<{
    requirements: WishlistRequirement[];
    evaluations: PropertyEvaluation[];
  } | null>(null);
  const [dialog, setDialog] = useState<"new" | "rename" | "delete" | null>(null);
  const [dialogName, setDialogName] = useState("");
  const [dialogBudget, setDialogBudget] = useState("");
  const [dialogError, setDialogError] = useState("");

  const activeId = activeWishlist?.id ?? "";
  const progress = useMemo(
    () => wishlistSetupProgress(activeRequirements),
    [activeRequirements],
  );
  const groups = useMemo(
    () => groupByCategory(activeRequirements),
    [activeRequirements],
  );
  const readyToActivate = useMemo(
    () => activeRequirements.filter(isRequirementReadyToActivate),
    [activeRequirements],
  );

  const counts = useMemo(() => {
    const byImportance = (importance: Importance) =>
      activeRequirements.filter(
        (requirement) => requirement.importance === importance,
      ).length;
    return {
      must: byImportance("must"),
      nice: byImportance("nice"),
      dealbreaker: byImportance("dealbreaker"),
      all: activeRequirements.length,
    };
  }, [activeRequirements]);

  const filtered = useMemo(() => {
    if (filter === "all") return activeRequirements;
    return activeRequirements.filter(
      (requirement) => requirement.importance === filter,
    );
  }, [activeRequirements, filter]);

  const filterTabs: { id: Filter; label: string }[] = [
    { id: "must", label: t("wishlist.filterMust", { count: counts.must }) },
    { id: "nice", label: t("wishlist.filterNice", { count: counts.nice }) },
    {
      id: "dealbreaker",
      label: t("wishlist.filterDealbreakers", {
        count: counts.dealbreaker,
      }),
    },
    { id: "all", label: t("wishlist.filterAll", { count: counts.all }) },
  ];

  const filterTitle =
    filter === "must"
      ? t("wishlist.myMustHaves")
      : filter === "nice"
        ? t("wishlist.myNiceToHaves")
        : filter === "dealbreaker"
          ? t("wishlist.myDealbreakers")
          : t("wishlist.allRequirements");

  const savedTo = accountSynced
    ? t("wishlist.storageAccount")
    : v2Synced
      ? evaluationsSynced
        ? t("wishlist.storageAccount")
        : t("wishlist.storageShared")
      : t("wishlist.storageDevice");

  const storageStatus = accountSynced
    ? t("wishlist.storageStatusAccount")
    : accountSyncError
      ? t("wishlist.storageStatusError")
      : !v2Synced
        ? t("wishlist.storageStatusDevice")
        : evaluationsSynced
          ? t("wishlist.storageStatusAccount")
          : t("wishlist.storageStatusShared");

  const bulkImportanceActions = (
    [
      { id: "must" as const, label: t("wishlist.bulkMoveMust") },
      { id: "nice" as const, label: t("wishlist.bulkMoveNice") },
      {
        id: "dealbreaker" as const,
        label: t("wishlist.bulkMoveDealbreaker"),
      },
      { id: "ignore" as const, label: t("wishlist.bulkMarkIgnore") },
    ] satisfies { id: Importance; label: string }[]
  ).filter((action) => filter === "all" || action.id !== filter);

  function changeFilter(next: Filter) {
    setFilter(next);
    setSelectedIds([]);
    setBulkNotice("");
  }

  function changeView(next: ViewMode) {
    setViewMode(next);
    setManageMode(false);
    setSelectedIds([]);
    setBulkNotice("");
  }

  function switchWishlist(wishlistId: string) {
    setActiveWishlist(wishlistId);
    setViewMode("priority");
    setFilter("must");
    setManageMode(false);
    setSelectedIds([]);
    setUndoBatch(null);
    setBulkNotice("");
  }

  function exitManage() {
    setManageMode(false);
    setSelectedIds([]);
    setBulkNotice("");
  }

  function toggleSelected(requirementId: string) {
    setSelectedIds((current) =>
      current.includes(requirementId)
        ? current.filter((id) => id !== requirementId)
        : [...current, requirementId],
    );
    setBulkNotice("");
  }

  function selectAllVisible() {
    setSelectedIds(filtered.map((requirement) => requirement.id));
    setBulkNotice("");
  }

  function deselectAll() {
    setSelectedIds([]);
    setBulkNotice("");
  }

  async function activateReadyRequirements() {
    if (readyToActivate.length === 0 || bulkBusy) return;
    setBulkBusy(true);
    setBulkNotice("");
    const result = await activateRequirements(
      readyToActivate.map((requirement) => requirement.id),
    );
    setBulkBusy(false);
    if (!result.ok) {
      setBulkNotice(t("wishlist.activateError"));
      return;
    }
    setSelectedIds([]);
    setBulkNotice(
      `${
        result.count === 1
          ? t("wishlist.activatedOne")
          : t("wishlist.activated", { count: result.count })
      } · ${savedTo}`,
    );
  }

  async function applyBulkImportance(importance: Importance) {
    if (selectedIds.length === 0 || bulkBusy) return;
    const count = selectedIds.length;
    setBulkBusy(true);
    setBulkNotice("");
    const result = await bulkSetImportance(selectedIds, importance);
    setBulkBusy(false);
    if (result.ok) {
      setSelectedIds([]);
      setBulkNotice(
        `${
          count === 1
            ? t("wishlist.bulkUpdatedOne")
            : t("wishlist.bulkUpdated", { count })
        } · ${savedTo}`,
      );
    } else {
      setBulkNotice(t("wishlist.bulkError"));
    }
  }

  function requestBulkDelete() {
    if (selectedIds.length === 0) return;
    setBulkDeleteOpen(true);
  }

  async function confirmBulkDelete() {
    if (selectedIds.length === 0 || bulkBusy) return;
    setBulkBusy(true);
    setBulkNotice("");
    const result = await bulkRemoveRequirements(selectedIds);
    setBulkBusy(false);
    if (result.ok) {
      setUndoBatch({
        requirements: result.removed,
        evaluations: result.removedEvaluations,
      });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      setBulkNotice("");
    } else {
      setBulkNotice(t("wishlist.bulkError"));
    }
  }

  async function undoRemove() {
    if (!undoBatch) return;
    const batch = undoBatch;
    setBulkBusy(true);
    const restored = await restoreRequirements(
      batch.requirements,
      batch.evaluations,
    );
    setBulkBusy(false);
    if (restored) {
      setUndoBatch(null);
      setBulkNotice(`${t("wishlist.bulkRestored")} · ${savedTo}`);
    } else {
      setBulkNotice(t("wishlist.bulkError"));
    }
  }

  function openNew() {
    setDialogName("");
    setDialogBudget("");
    setDialogError("");
    setDialog("new");
  }

  function openNewRequirement() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openRename(wishlist: Wishlist) {
    setDialogName(wishlist.name);
    setDialogError("");
    setDialog("rename");
  }

  function submitNew(event: FormEvent) {
    event.preventDefault();
    const name = dialogName.trim();
    if (!name) {
      setDialogError(t("wishlist.nameRequired"));
      return;
    }
    const parsedBudget = Number(dialogBudget.replace(/,/g, ""));
    createWishlist(
      name,
      Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : null,
      true,
    );
    setViewMode("priority");
    setFilter("must");
    setManageMode(false);
    setSelectedIds([]);
    setUndoBatch(null);
    setBulkNotice("");
    setDialog(null);
  }

  function submitRename(event: FormEvent) {
    event.preventDefault();
    if (!activeWishlist) return;
    const name = dialogName.trim();
    if (!name) {
      setDialogError(t("wishlist.nameRequired"));
      return;
    }
    renameWishlist(activeWishlist.id, name);
    setDialog(null);
  }

  function confirmDuplicate() {
    if (!activeWishlist) return;
    duplicateWishlist(activeWishlist.id);
  }

  function confirmDelete() {
    if (!activeWishlist) return;
    const removed = deleteWishlist(activeWishlist.id);
    if (removed) {
      setDialog(null);
      setManageOpen(false);
      setViewMode("priority");
      setFilter("must");
      setManageMode(false);
      setSelectedIds([]);
      setUndoBatch(null);
      setBulkNotice("");
    }
  }

  function commitBudget(raw: string) {
    if (!activeWishlist) return;
    const parsed = Number(raw.replace(/,/g, ""));
    updateWishlistBudget(
      activeWishlist.id,
      Number.isFinite(parsed) && parsed > 0 ? parsed : null,
    );
  }

  const activeName = activeWishlist
    ? translateWishlistName(activeWishlist.name, locale)
    : "";
  const draftImportance: Importance =
    viewMode === "priority" && filter === "nice"
      ? "nice"
      : viewMode === "priority" && filter === "dealbreaker"
        ? "dealbreaker"
        : "must";

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start justify-between px-6 pt-8">
        <div className="flex items-start gap-3">
          <BackButton onClick={onBack} label={t("common.backToDashboard")} />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
              {t("wishlist.eyebrow")}
            </p>
            <h1 className="mt-1 font-serif text-[31px] leading-none tracking-[-0.02em] text-ink">
              {t("wishlist.title")}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={openNew}
          aria-label={t("wishlist.new")}
          className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-olive text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </header>

      <div
        className={[
          "px-6",
          viewMode === "priority" &&
          manageMode &&
          selectedIds.length > 0
            ? "pb-44"
            : "pb-9",
        ].join(" ")}
      >
        <div
          className="-mx-6 mt-5 flex gap-2 overflow-x-auto px-6 pb-1"
          role="group"
          aria-label={t("wishlist.switch")}
        >
          {wishlists.map((wishlist) => {
            const isActive = wishlist.id === activeId;
            return (
              <button
                key={wishlist.id}
                type="button"
                onClick={() => switchWishlist(wishlist.id)}
                aria-pressed={isActive}
                className={[
                  "min-h-10 shrink-0 rounded-full border px-3.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40",
                  isActive
                    ? "border-olive bg-olive font-medium text-cream"
                    : "border-line bg-white/50 text-muted hover:text-ink",
                ].join(" ")}
              >
                {translateWishlistName(wishlist.name, locale)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={openNew}
            className="min-h-10 shrink-0 rounded-full border border-dashed border-olive/35 px-3.5 text-[11px] text-olive transition-colors hover:bg-olive/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
          >
            <PlusIcon className="mr-1 inline h-3 w-3" />
            {t("wishlist.new")}
          </button>
        </div>

        {activeWishlist && (
          <section className="mt-3 rounded-[24px] border border-line bg-parchment px-4 pb-3.5 pt-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted">
                  {t("dashboard.activeWishlist")}
                </p>
                <h2 className="mt-0.5 break-words font-serif text-[21px] leading-tight tracking-[-0.01em] text-ink">
                  {activeName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setManageOpen((value) => !value)}
                aria-expanded={manageOpen}
                className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-line bg-white/60 px-2.5 text-[9.5px] font-medium text-ink"
              >
                {manageOpen
                  ? t("wishlist.hideWishlistSettings")
                  : t("wishlist.manageWishlist")}
                <ChevronDownIcon
                  className={[
                    "h-3 w-3 transition-transform",
                    manageOpen ? "rotate-180" : "",
                  ].join(" ")}
                />
              </button>
            </div>

            <div className="mt-2.5 flex items-center gap-3">
              <ProgressBar value={progress.percent} />
              <span className="shrink-0 text-[10px] tabular-nums text-muted">
                {Math.round(progress.percent)}%
              </span>
            </div>
            <p className="mt-1.5 text-[10.5px] text-muted">
              {t("wishlist.progressDetail", {
                done: progress.configured,
                total: progress.total,
              })}
            </p>
            <p className="mt-1 text-[9.5px] leading-4 text-muted/80">
              {storageStatus}
            </p>

            {ready && readyToActivate.length > 0 && (
              <div className="mt-2.5 rounded-xl border border-olive/20 bg-olive/[0.05] px-3 py-2.5">
                <p className="text-[10px] leading-4 text-ink">
                  {t("wishlist.readyToActivate", {
                    count: readyToActivate.length,
                  })}
                </p>
                <button
                  type="button"
                  onClick={activateReadyRequirements}
                  disabled={bulkBusy}
                  className="mt-1.5 min-h-9 rounded-full bg-olive px-3 text-[10px] font-medium text-cream disabled:opacity-50"
                >
                  {readyToActivate.length === 1
                    ? t("wishlist.activateReadyOne")
                    : t("wishlist.activateReady", {
                        count: readyToActivate.length,
                      })}
                </button>
              </div>
            )}

            {manageOpen && (
              <div className="mt-3 border-t border-line/80 pt-3">
                <p className="text-[9.5px] leading-4 text-muted">
                  {t("wishlist.progressNote")}
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <label className="min-w-0 flex-1">
                    <span className="text-[9px] uppercase tracking-[0.14em] text-muted">
                      {t("wishlist.budget")}
                    </span>
                    <input
                      key={`${activeWishlist.id}-${activeWishlist.budget ?? ""}`}
                      defaultValue={
                        activeWishlist.budget
                          ? String(activeWishlist.budget)
                          : ""
                      }
                      onBlur={(event) =>
                        commitBudget(event.currentTarget.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          commitBudget(event.currentTarget.value);
                          event.currentTarget.blur();
                        }
                      }}
                      inputMode="numeric"
                      placeholder={t("wishlist.budgetPlaceholder")}
                      className="mt-1 w-full rounded-xl border border-line bg-white/60 px-3 py-2 text-[11.5px] tabular-nums text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-olive/35 focus:ring-2 focus:ring-olive/15"
                    />
                  </label>
                  <p className="shrink-0 pb-2 text-[10.5px] tabular-nums text-muted">
                    {activeWishlist.budget
                      ? formatPrice(activeWishlist.budget, locale)
                      : "—"}
                  </p>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openRename(activeWishlist)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-white/60 px-3 text-[10px] font-medium text-ink"
                  >
                    <PencilIcon className="h-3 w-3 text-olive" />
                    {t("wishlist.rename")}
                  </button>
                  <button
                    type="button"
                    onClick={confirmDuplicate}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-white/60 px-3 text-[10px] font-medium text-ink"
                  >
                    <PlusIcon className="h-3 w-3 text-olive" />
                    {t("wishlist.duplicate")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialog("delete")}
                    disabled={wishlists.length <= 1}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-white/60 px-3 text-[10px] font-medium text-muted transition-colors hover:border-clay/30 hover:text-clay disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <TrashIcon className="h-3 w-3" />
                    {t("wishlist.delete")}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        <div className="mt-4 flex rounded-full border border-line bg-parchment p-1">
          {(
            [
              { id: "priority" as const, label: t("wishlist.viewByPriority") },
              { id: "category" as const, label: t("wishlist.viewByCategory") },
            ]
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => changeView(option.id)}
              aria-pressed={viewMode === option.id}
              className={[
                "min-h-9 flex-1 rounded-full px-2 text-[10.5px] transition-colors",
                viewMode === option.id
                  ? "bg-olive font-medium text-cream shadow-sm"
                  : "text-muted hover:text-ink",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>

        {viewMode === "priority" && (
          <>
            <div
              className="-mx-6 mt-3 flex gap-2 overflow-x-auto px-6 pb-1"
              role="group"
              aria-label={t("wishlist.filterAria")}
            >
              {filterTabs.map((tab) => {
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => changeFilter(tab.id)}
                    aria-pressed={isActive}
                    className={[
                      "min-h-9 shrink-0 rounded-full border px-3 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40",
                      isActive
                        ? "border-olive bg-olive font-medium text-cream"
                        : "border-line bg-white/55 text-muted hover:text-ink",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-[21px] tracking-[-0.01em] text-ink">
                {filterTitle}
              </h2>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (manageMode) {
                      exitManage();
                    } else {
                      setManageMode(true);
                      setSelectedIds([]);
                      setBulkNotice("");
                    }
                  }}
                  className="inline-flex min-h-9 items-center rounded-full border border-line bg-white/60 px-3 text-[10px] font-medium text-ink"
                >
                  {manageMode ? t("common.cancel") : t("wishlist.manage")}
                </button>
                <button
                  type="button"
                  onClick={openNewRequirement}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-olive px-3 text-[10px] font-medium text-cream"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  {t("wishlist.addRequirement")}
                </button>
              </div>
            </div>

            {manageMode && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-parchment/70 px-3 py-2">
                <p className="text-[10px] tabular-nums text-muted">
                  {selectedIds.length === 1
                    ? t("wishlist.selectedOne")
                    : t("wishlist.selectedCount", {
                        count: selectedIds.length,
                      })}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={selectAllVisible}
                    className="min-h-9 rounded-full border border-line bg-white/70 px-2.5 text-[9.5px] font-medium text-ink"
                  >
                    {t("wishlist.selectAll")}
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    disabled={selectedIds.length === 0}
                    className="min-h-9 rounded-full border border-line bg-white/70 px-2.5 text-[9.5px] font-medium text-muted disabled:opacity-40"
                  >
                    {t("wishlist.deselectAll")}
                  </button>
                  <button
                    type="button"
                    onClick={exitManage}
                    className="min-h-9 rounded-full bg-olive px-3 text-[9.5px] font-medium text-cream"
                  >
                    {t("common.done")}
                  </button>
                </div>
              </div>
            )}

            {bulkNotice && (
              <p
                role="status"
                className={[
                  "mt-2 text-[10px]",
                  bulkNotice === t("wishlist.bulkError")
                    ? "text-clay"
                    : "text-olive",
                ].join(" ")}
              >
                {bulkNotice}
              </p>
            )}

            {undoBatch && (
              <div
                role="status"
                className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-olive/20 bg-olive/[0.06] px-3 py-2"
              >
                <p className="text-[10px] text-ink">
                  {`${
                    undoBatch.requirements.length === 1
                      ? t("wishlist.bulkRemovedOne")
                      : t("wishlist.bulkRemoved", {
                          count: undoBatch.requirements.length,
                        })
                  } · ${savedTo}`}
                </p>
                <button
                  type="button"
                  onClick={undoRemove}
                  disabled={bulkBusy}
                  className="min-h-9 shrink-0 rounded-full bg-olive px-3 text-[9.5px] font-medium text-cream disabled:opacity-50"
                >
                  {t("wishlist.undo")}
                </button>
              </div>
            )}

            {activeRequirements.length === 0 ? (
              <div className="mt-3 rounded-[20px] border border-line bg-white/45 px-5 py-7 text-center">
                <p className="font-serif text-[18px] text-ink">
                  {t("wishlist.noRequirements")}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-muted">
                  {t("wishlist.noRequirementsBody")}
                </p>
                <button
                  type="button"
                  onClick={openNewRequirement}
                  className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-olive px-4 text-[11px] font-medium text-cream"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  {t("wishlist.addRequirement")}
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-3 rounded-[20px] border border-line bg-white/45 px-5 py-7 text-center">
                <p className="font-serif text-[18px] text-ink">
                  {filter === "must"
                    ? t("wishlist.emptyMust")
                    : t("wishlist.emptyFilter")}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-muted">
                  {filter === "must"
                    ? t("wishlist.emptyMustBody")
                    : t("wishlist.emptyFilterBody")}
                </p>
                <button
                  type="button"
                  onClick={openNewRequirement}
                  className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-olive px-4 text-[11px] font-medium text-cream"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  {t("wishlist.addRequirement")}
                </button>
              </div>
            ) : (
              <div className="mt-3 overflow-hidden rounded-[20px] border border-line bg-white/55">
                {filtered.map((requirement, index) => (
                  <div
                    key={requirement.id}
                    className={
                      index > 0 ? "border-t border-line/70" : ""
                    }
                  >
                    <PriorityRow
                      requirement={requirement}
                      onEdit={() => {
                        setEditing(requirement);
                        setEditorOpen(true);
                      }}
                      manageMode={manageMode}
                      selected={selectedIds.includes(requirement.id)}
                      onToggle={() => toggleSelected(requirement.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {viewMode === "category" && (
          <section className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-[21px] tracking-[-0.01em] text-ink">
                {t("wishlist.summary")}
              </h2>
              <button
                type="button"
                onClick={openNewRequirement}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-olive px-3 text-[10px] font-medium text-cream"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                {t("wishlist.addRequirement")}
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="mt-3 rounded-[20px] border border-line bg-white/45 px-5 py-7 text-center">
                <p className="font-serif text-[18px] text-ink">
                  {t("wishlist.noRequirements")}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-muted">
                  {t("wishlist.noRequirementsBody")}
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2.5">
                {groups.map(({ category, items }) => {
                  const isOpen = openCategory === category;
                  const configured = items.filter(
                    (item) =>
                      item.configured && isRequirementComplete(item),
                  ).length;
                  const percent =
                    (configured / Math.max(1, items.length)) * 100;
                  return (
                    <div
                      key={category}
                      className="overflow-hidden rounded-[20px] border border-line bg-white/50"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenCategory(isOpen ? null : category)
                        }
                        aria-expanded={isOpen}
                        className="w-full px-4 pb-3.5 pt-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-olive/30"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[13px] font-medium text-ink">
                            {t(categoryKey(category))}
                          </span>
                          <span className="text-[10px] tabular-nums text-muted">
                            {configured}/{items.length}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2.5">
                          <ProgressBar value={percent} />
                          <ChevronRightIcon
                            className={[
                              "h-3.5 w-3.5 shrink-0 text-muted transition-transform",
                              isOpen ? "rotate-90" : "",
                            ].join(" ")}
                          />
                        </div>
                      </button>

                      {isOpen && (
                        <ul className="border-t border-line/80 px-2 py-1.5">
                          {items.map((requirement) => (
                            <li key={requirement.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditing(requirement);
                                  setEditorOpen(true);
                                }}
                                className="flex w-full items-start gap-2.5 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-parchment/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-olive/30"
                              >
                                <span
                                  className={[
                                    "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                                    requirement.importance === "must"
                                      ? "bg-olive"
                                      : requirement.importance === "nice"
                                        ? "bg-gold"
                                        : requirement.importance ===
                                            "dealbreaker"
                                          ? "bg-clay"
                                          : "bg-muted/40",
                                  ].join(" ")}
                                />
                                <span className="min-w-0 flex-1">
                                  <span
                                    className={[
                                      "block text-[12px] leading-4",
                                      requirement.configured
                                        ? "text-ink/90"
                                        : "text-muted",
                                    ].join(" ")}
                                  >
                                    {translateRequirementName(
                                      requirement.name,
                                      locale,
                                      Boolean(requirement.custom),
                                    )}
                                  </span>
                                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                                    <span className="text-[9.5px] tabular-nums text-muted">
                                      {expectedLabel(requirement, locale, t)}
                                    </span>
                                    <ImportanceBadge
                                      importance={requirement.importance}
                                    />
                                    {!requirement.configured && (
                                      <span className="rounded-full border border-line bg-parchment px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] text-muted">
                                        {t("wishlist.draft")}
                                      </span>
                                    )}
                                  </span>
                                </span>
                                <ChevronRightIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-muted/50" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section className="mt-5 rounded-[20px] border border-line bg-parchment/70 px-4 py-3.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            {t("wishlist.rules")}
          </p>
          <p className="mt-1.5 text-[11px] leading-5 text-muted">
            {t("wishlist.rulesBody")}
          </p>
          <p className="mt-1.5 text-[10px] leading-4 text-muted">
            {t("wishlist.importanceHint")}
          </p>
        </section>

        <button
          type="button"
          onClick={onBrowseHomes}
          className="relative mt-5 block h-32 w-full overflow-hidden rounded-[24px] border border-line text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
        >
          <HouseIllustration className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-olive-deep/90 via-olive-deep/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
            <div>
              <p className="font-serif text-[19px] leading-tight text-cream">
                {t("wishlist.inspiration")}
              </p>
              <p className="mt-1 text-[11px] leading-4 text-cream/75">
                {t("wishlist.inspirationBody")}
              </p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream/95 text-olive">
              <ArrowRightIcon className="h-4 w-4" />
            </span>
          </div>
        </button>
      </div>

      {viewMode === "priority" &&
        manageMode &&
        selectedIds.length > 0 && (
          <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 mx-auto w-full max-w-[430px] px-4">
            <div className="rounded-[20px] border border-line bg-cream/95 p-2.5 shadow-[0_18px_45px_-20px_rgba(36,34,31,0.55)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] tabular-nums text-muted">
                  {selectedIds.length === 1
                    ? t("wishlist.selectedOne")
                    : t("wishlist.selectedCount", {
                        count: selectedIds.length,
                      })}
                </p>
                <button
                  type="button"
                  onClick={exitManage}
                  className="min-h-8 rounded-full border border-line bg-white/70 px-3 text-[9.5px] font-medium text-ink"
                >
                  {t("common.done")}
                </button>
              </div>
              <div
                className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5"
                role="group"
                aria-label={t("wishlist.bulkActions")}
              >
                {bulkImportanceActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => applyBulkImportance(action.id)}
                    disabled={bulkBusy}
                    className="min-h-9 shrink-0 rounded-full border border-line bg-white/70 px-3 text-[9.5px] font-medium text-ink disabled:opacity-50"
                  >
                    {action.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={requestBulkDelete}
                  disabled={bulkBusy}
                  className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-clay/25 bg-clay/[0.06] px-3 text-[9.5px] font-medium text-clay disabled:opacity-50"
                >
                  <TrashIcon className="h-3 w-3" />
                  {t("wishlist.bulkRemove")}
                </button>
              </div>
            </div>
          </div>
        )}

      {editorOpen && (
        <RequirementEditor
          key={editing?.id ?? `new-${activeId}`}
          open
          wishlistId={activeId}
          requirement={editing}
          defaultImportance={draftImportance}
          onClose={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
        />
      )}

      <Sheet
        open={dialog === "new" || dialog === "rename"}
        title={dialog === "new" ? t("wishlist.new") : t("wishlist.rename")}
        onClose={() => setDialog(null)}
        footer={
          <button
            type="submit"
            form="wishlist-name-form"
            className="min-h-11 w-full rounded-full bg-olive px-4 text-[13px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
          >
            {dialog === "new" ? t("wishlist.create") : t("common.done")}
          </button>
        }
      >
        <form
          id="wishlist-name-form"
          onSubmit={dialog === "new" ? submitNew : submitRename}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="wishlist-name"
              className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
            >
              {t("wishlist.title")}
            </label>
            <input
              id="wishlist-name"
              value={dialogName}
              onChange={(event) => setDialogName(event.target.value)}
              placeholder={t("wishlist.newPlaceholder")}
              autoFocus
              className="mt-2 w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-[13px] text-ink outline-none transition-colors focus:border-olive/35 focus:ring-2 focus:ring-olive/15"
            />
          </div>
          {dialog === "new" && (
            <div>
              <label
                htmlFor="wishlist-budget"
                className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
              >
                {t("wishlist.budget")}{" "}
                <span className="normal-case text-muted">
                  {t("common.optional")}
                </span>
              </label>
              <input
                id="wishlist-budget"
                value={dialogBudget}
                onChange={(event) => setDialogBudget(event.target.value)}
                inputMode="numeric"
                placeholder={t("wishlist.budgetPlaceholder")}
                className="mt-2 w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-[13px] tabular-nums text-ink outline-none transition-colors focus:border-olive/35 focus:ring-2 focus:ring-olive/15"
              />
            </div>
          )}
          {dialogError && (
            <p role="alert" className="text-[11px] text-gold">
              {dialogError}
            </p>
          )}
        </form>
      </Sheet>

      <Sheet
        open={dialog === "delete"}
        title={t("wishlist.deleteTitle", { name: activeName })}
        onClose={() => setDialog(null)}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDialog(null)}
              className="min-h-11 flex-1 rounded-full border border-line bg-white/70 text-[12px] font-medium text-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
            >
              {t("wishlist.keep")}
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="min-h-11 flex-1 rounded-full bg-clay text-[12px] font-medium text-cream transition-colors hover:bg-clay/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
            >
              {t("common.delete")}
            </button>
          </div>
        }
      >
        <p className="text-[12px] leading-5 text-muted">
          {t("wishlist.deleteBody")}
        </p>
      </Sheet>

      <Sheet
        open={bulkDeleteOpen}
        title={
          selectedIds.length === 1
            ? t("wishlist.bulkDeleteTitleOne")
            : t("wishlist.bulkDeleteTitle", {
                count: selectedIds.length,
              })
        }
        onClose={() => setBulkDeleteOpen(false)}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBulkDeleteOpen(false)}
              className="min-h-11 flex-1 rounded-full border border-line bg-white/70 text-[12px] font-medium text-ink"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={confirmBulkDelete}
              disabled={bulkBusy}
              className="min-h-11 flex-1 rounded-full bg-clay text-[12px] font-medium text-cream disabled:opacity-50"
            >
              {selectedIds.length === 1
                ? t("wishlist.bulkDeleteConfirmOne")
                : t("wishlist.bulkDeleteConfirm")}
            </button>
          </div>
        }
      >
        <p className="text-[12px] leading-5 text-muted">
          {t("wishlist.bulkDeleteBody", { name: activeName })}
        </p>
        <p className="mt-2 text-[11px] leading-4 text-muted">
          {selectedIds.length === 1
            ? t("wishlist.selectedOne")
            : t("wishlist.selectedCount", { count: selectedIds.length })}
        </p>
      </Sheet>
    </div>
  );
}
