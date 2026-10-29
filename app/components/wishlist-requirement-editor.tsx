"use client";

import { useState } from "react";
import { useAppData } from "../lib/app-data";
import {
  categoryKey,
  importanceKey,
  requirementTypeKey,
  translateRequirementName,
  translateWishlistText,
  useI18n,
  type TranslationKey,
} from "../lib/i18n";
import {
  CATEGORY_ORDER,
  FEATURE_BY_KEY,
  FEATURE_CATALOG,
  IMPORTANCE_ORDER,
  REQUIREMENT_TYPES,
  type Importance,
  type RequirementType,
  type RequirementValue,
  type WishlistCategory,
  type WishlistRequirement,
} from "../lib/v2-types";
import { slug } from "../lib/wishlists";
import { Sheet } from "./sheet";
import { TrashIcon } from "./icons";

const fieldClass =
  "w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-[13px] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-olive/35 focus:ring-2 focus:ring-olive/15";

export function RequirementEditor({
  open,
  wishlistId,
  requirement,
  defaultImportance = "must",
  onClose,
}: {
  open: boolean;
  wishlistId: string;
  requirement: WishlistRequirement | null;
  defaultImportance?: Importance;
  onClose: () => void;
}) {
  const { addRequirement, updateRequirement, removeRequirement } = useAppData();
  const { t, locale } = useI18n();

  const editing = Boolean(requirement);
  const initialExpected = requirement?.expectedValue ?? null;
  const initialRange =
    requirement?.type === "range" &&
    initialExpected &&
    typeof initialExpected === "object" &&
    !Array.isArray(initialExpected)
      ? (initialExpected as { min?: number; max?: number })
      : {};
  const initialText =
    requirement?.type === "yes" || requirement?.type === "range"
      ? ""
      : initialExpected &&
          typeof initialExpected === "object" &&
          !Array.isArray(initialExpected)
        ? ((initialExpected as { values?: string[] }).values ?? []).join(", ")
        : initialExpected === null || initialExpected === undefined
          ? ""
          : String(initialExpected);

  const [name, setName] = useState(requirement?.name ?? "");
  const [category, setCategory] = useState<WishlistCategory>(
    requirement?.category ?? "bedrooms",
  );
  const [featureKey, setFeatureKey] = useState(requirement?.featureKey ?? "beds");
  const [type, setType] = useState<RequirementType>(requirement?.type ?? "min");
  const [importance, setImportance] = useState<Importance>(
    requirement?.importance ?? defaultImportance,
  );
  const [expectedBoolean, setExpectedBoolean] = useState(
    initialExpected === true || initialExpected === undefined,
  );
  const [expectedText, setExpectedText] = useState(initialText);
  const [rangeMin, setRangeMin] = useState(
    initialRange.min === undefined ? "" : String(initialRange.min),
  );
  const [rangeMax, setRangeMax] = useState(
    initialRange.max === undefined ? "" : String(initialRange.max),
  );
  const [weight, setWeight] = useState(
    requirement?.weight === null || requirement?.weight === undefined
      ? ""
      : String(requirement.weight),
  );
  const [configured, setConfigured] = useState(requirement?.configured ?? true);
  const [error, setError] = useState("");

  const catalogFeature = FEATURE_BY_KEY[featureKey];
  const isCustom = featureKey.startsWith("custom:");

  function chooseFeature(nextKey: string) {
    setFeatureKey(nextKey);
    const feature = FEATURE_BY_KEY[nextKey];
    if (feature) {
      setCategory(feature.category);
      if (!name.trim()) setName(feature.label);
      if (feature.key === "excludedCity") setType("exclude");
      else if (feature.kind === "boolean") setType("yes");
      else if (feature.kind === "number") setType("min");
      else setType("text");
    }
  }

  function save() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t("wishlist.requirementNameRequired"));
      return;
    }

    let expectedValue: RequirementValue;
    if (type === "yes") {
      expectedValue = expectedBoolean;
    } else if (type === "range") {
      const min = Number(rangeMin);
      const max = Number(rangeMax);
      if (!rangeMin.trim() || !rangeMax.trim() || !Number.isFinite(min) || !Number.isFinite(max)) {
        setError(t("wishlist.expectedRequired"));
        return;
      }
      expectedValue = { min, max };
    } else if (type === "min" || type === "max") {
      const numeric = Number(expectedText.replace(/,/g, "."));
      if (!expectedText.trim() || !Number.isFinite(numeric)) {
        setError(t("wishlist.expectedRequired"));
        return;
      }
      expectedValue = numeric;
    } else {
      const text = expectedText.trim();
      if (!text && configured) {
        setError(t("wishlist.expectedRequired"));
        return;
      }
      expectedValue = text;
    }

    const parsedWeight = weight.trim() === "" ? null : Number(weight);
    const finalFeatureKey = isCustom
      ? requirement?.featureKey.startsWith("custom:")
        ? requirement.featureKey
        : `custom:${slug(trimmedName)}`
      : featureKey;

    if (requirement) {
      updateRequirement(requirement.id, {
        name: trimmedName,
        category,
        featureKey: finalFeatureKey,
        type,
        expectedValue,
        importance,
        weight:
          parsedWeight !== null && Number.isFinite(parsedWeight) && parsedWeight >= 0
            ? parsedWeight
            : null,
        configured,
        custom: isCustom,
      });
    } else {
      addRequirement({
        wishlistId,
        name: trimmedName,
        category,
        featureKey: finalFeatureKey,
        type,
        expectedValue,
        importance,
        weight:
          parsedWeight !== null && Number.isFinite(parsedWeight) && parsedWeight >= 0
            ? parsedWeight
            : null,
        configured,
        custom: isCustom,
      });
    }
    onClose();
  }

  function remove() {
    if (!requirement) return;
    removeRequirement(requirement.id);
    onClose();
  }

  return (
    <Sheet
      open={open}
      title={
        editing ? t("wishlist.editRequirement") : t("wishlist.newRequirement")
      }
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          {requirement && (
            <button
              type="button"
              onClick={remove}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-white/60 text-muted transition-colors hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30"
              aria-label={t("wishlist.deleteRequirement")}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={save}
            className="min-h-11 flex-1 rounded-full bg-olive px-4 text-[13px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            {t("wishlist.saveRequirement")}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label
            htmlFor="requirement-name"
            className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
          >
            {t("wishlist.requirementName")}
          </label>
          <input
            id="requirement-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("wishlist.namePlaceholder")}
            className={`${fieldClass} mt-2`}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="requirement-category"
              className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
            >
              {t("wishlist.category")}
            </label>
            <select
              id="requirement-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as WishlistCategory)
              }
              className={`${fieldClass} mt-2 appearance-none`}
            >
              {CATEGORY_ORDER.map((entry) => (
                <option key={entry} value={entry}>
                  {t(categoryKey(entry))}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="requirement-importance"
              className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
            >
              {t("wishlist.importance")}
            </label>
            <select
              id="requirement-importance"
              value={importance}
              onChange={(event) =>
                setImportance(event.target.value as Importance)
              }
              className={`${fieldClass} mt-2 appearance-none`}
            >
              {IMPORTANCE_ORDER.map((entry) => (
                <option key={entry} value={entry}>
                  {t(importanceKey(entry))}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="requirement-feature"
            className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
          >
            {t("wishlist.feature")}
          </label>
          <select
            id="requirement-feature"
            value={isCustom ? "__custom" : featureKey}
            onChange={(event) => {
              if (event.target.value === "__custom") {
                chooseFeature(`custom:${slug(name || "custom")}`);
                setType("yes");
                setExpectedBoolean(true);
              } else {
                chooseFeature(event.target.value);
              }
            }}
            className={`${fieldClass} mt-2 appearance-none`}
          >
            {FEATURE_CATALOG.map((feature) => (
              <option key={feature.key} value={feature.key}>
                {t(categoryKey(feature.category))} ·{" "}
                {translateWishlistText(feature.label, locale)}
              </option>
            ))}
            <option value="__custom">{t("wishlist.customFeature")}</option>
          </select>
          {isCustom && (
            <p className="mt-1.5 text-[10px] leading-4 text-muted">
              {t("edit.unknownHint")}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="requirement-type"
            className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
          >
            {t("wishlist.type")}
          </label>
          <select
            id="requirement-type"
            value={type}
            onChange={(event) => setType(event.target.value as RequirementType)}
            className={`${fieldClass} mt-2 appearance-none`}
          >
            {REQUIREMENT_TYPES.map((entry) => (
              <option key={entry} value={entry}>
                {t(requirementTypeKey(entry))}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-line bg-parchment/60 px-4 py-3.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            {t("wishlist.expected")}
          </p>

          {type === "yes" && (
            <div className="mt-2 flex gap-1 rounded-full border border-line bg-white/60 p-1">
              {[true, false].map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => setExpectedBoolean(value)}
                  aria-pressed={expectedBoolean === value}
                  className={[
                    "min-h-9 flex-1 rounded-full px-3 text-[11px] font-medium transition-colors",
                    expectedBoolean === value
                      ? "bg-olive text-cream"
                      : "text-muted hover:text-ink",
                  ].join(" ")}
                >
                  {value ? t("common.yes") : t("common.no")}
                </button>
              ))}
            </div>
          )}

          {type === "min" && (
            <input
              value={expectedText}
              onChange={(event) => setExpectedText(event.target.value)}
              inputMode="decimal"
              placeholder={t("wishlist.expectedMin")}
              className={`${fieldClass} mt-2`}
              aria-label={t("wishlist.expectedMin")}
            />
          )}

          {type === "max" && (
            <input
              value={expectedText}
              onChange={(event) => setExpectedText(event.target.value)}
              inputMode="decimal"
              placeholder={t("wishlist.expectedMax")}
              className={`${fieldClass} mt-2`}
              aria-label={t("wishlist.expectedMax")}
            />
          )}

          {type === "range" && (
            <div className="mt-2 flex items-center gap-2">
              <input
                value={rangeMin}
                onChange={(event) => setRangeMin(event.target.value)}
                inputMode="decimal"
                placeholder={t("wishlist.expectedMin")}
                className={fieldClass}
                aria-label={t("wishlist.expectedMin")}
              />
              <span className="text-muted">–</span>
              <input
                value={rangeMax}
                onChange={(event) => setRangeMax(event.target.value)}
                inputMode="decimal"
                placeholder={t("wishlist.expectedMax")}
                className={fieldClass}
                aria-label={t("wishlist.expectedMax")}
              />
            </div>
          )}

          {(type === "text" || type === "exclude") && (
            <input
              value={expectedText}
              onChange={(event) => setExpectedText(event.target.value)}
              placeholder={
                type === "exclude"
                  ? t("wishlist.expectedExclude")
                  : t("wishlist.expectedText")
              }
              className={`${fieldClass} mt-2`}
              aria-label={
                type === "exclude"
                  ? t("wishlist.expectedExclude")
                  : t("wishlist.expectedText")
              }
            />
          )}

          {type === "exclude" && (
            <p className="mt-1.5 text-[10px] leading-4 text-muted">
              {t("wishlist.excludeHint")}
            </p>
          )}

          <p className="mt-2 text-[10px] leading-4 text-muted">
            {t(`${importanceKey(importance)}Hint` as TranslationKey)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="requirement-weight"
              className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
            >
              {t("wishlist.weight")}
            </label>
            <input
              id="requirement-weight"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              inputMode="decimal"
              placeholder={
                importance === "must"
                  ? "5"
                  : importance === "nice"
                    ? "2"
                    : "0"
              }
              className={`${fieldClass} mt-2`}
            />
          </div>

          <label className="flex items-end gap-2 pb-1">
            <input
              type="checkbox"
              checked={configured}
              onChange={(event) => setConfigured(event.target.checked)}
              className="h-5 w-5 rounded border-line accent-olive"
            />
            <span className="text-[10.5px] leading-4 text-ink/80">
              {t("wishlist.reviewed")}
            </span>
          </label>
        </div>

        <p className="rounded-2xl bg-parchment px-4 py-3 text-[10.5px] leading-4 text-muted">
          {t("wishlist.rulesBody")}
        </p>

        {error && (
          <p role="alert" className="text-[11px] text-gold">
            {error}
          </p>
        )}

        {editing && requirement && (
          <p className="text-[10px] text-muted">
            {translateRequirementName(
              requirement.name,
              locale,
              Boolean(requirement.custom),
            )}
            {catalogFeature
              ? ` · ${translateWishlistText(catalogFeature.label, locale)}`
              : ""}
          </p>
        )}
      </div>
    </Sheet>
  );
}
