"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useAppData } from "../../lib/app-data";
import { budgetEstimateInfo } from "../../lib/budget-estimate";
import {
  calculateBudget,
  inputsForProperty,
  normalizeBudgetInputs,
  withDownAmount,
  withDownPercent,
  withPrice,
} from "../../lib/finance";
import { formatPrice, formatPriceShort, type Home } from "../../lib/homes";
import { useI18n } from "../../lib/i18n";
import type { BudgetBreakdownKey } from "../../lib/finance";
import {
  DEFAULT_BUDGET_INPUTS,
  type BudgetInputs,
} from "../../lib/v2-types";
import { BackButton } from "../back-button";
import { PropertyPhoto } from "../property-photo";
import { CheckIcon } from "../icons";

type Mode = "monthly" | "total";

function rangeFill(value: number, min: number, max: number) {
  return `${Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))}%`;
}

function NumberField({
  id,
  label,
  value,
  onCommit,
  prefix,
  suffix,
  step = "any",
}: {
  id: string;
  label: string;
  value: number;
  onCommit: (value: number) => void;
  prefix?: string;
  suffix?: string;
  step?: string;
}) {
  const display = String(Math.round(value * 100) / 100);

  function commit(input: HTMLInputElement) {
    const parsed = Number(input.value.replace(/,/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) {
      input.value = display;
      return;
    }
    onCommit(parsed);
  }

  return (
    <label className="block">
      <span className="text-[10px] text-muted">{label}</span>
      <span className="mt-1.5 flex items-center rounded-xl border border-line bg-white/70 focus-within:border-olive/35 focus-within:ring-2 focus-within:ring-olive/15">
        {prefix && (
          <span className="pl-3 text-[11px] text-muted" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          key={display}
          id={id}
          defaultValue={display}
          onBlur={(event) => commit(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit(event.currentTarget);
              event.currentTarget.blur();
            }
          }}
          type="number"
          min={0}
          step={step}
          inputMode="decimal"
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[12px] tabular-nums text-ink outline-none"
          aria-label={label}
        />
        {suffix && (
          <span className="pr-3 text-[11px] text-muted" aria-hidden="true">
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}

export function BudgetScreen({
  onBack,
  property,
}: {
  onBack: () => void;
  property?: Home | null;
}) {
  const {
    defaultScenario,
    getBudgetScenarioForProperty,
    getBudgetEstimateForHome,
    saveScenarioInputs,
  } = useAppData();
  const { t, locale } = useI18n();
  const scenario = property
    ? getBudgetScenarioForProperty(property.id)
    : defaultScenario;

  const initialInputs = useMemo<BudgetInputs>(() => {
    if (scenario?.inputs) return normalizeBudgetInputs(scenario.inputs);
    if (property) {
      return inputsForProperty(
        { price: property.price, hoa: property.hoa },
        {
          downPercent: defaultScenario.inputs.downPercent,
          rate: defaultScenario.inputs.rate,
          termYears: defaultScenario.inputs.termYears,
          targetMonthly: defaultScenario.inputs.targetMonthly,
        },
      );
    }
    return defaultScenario.inputs ?? DEFAULT_BUDGET_INPUTS;
  }, [scenario?.id, property?.id, defaultScenario.inputs]); // eslint-disable-line react-hooks/exhaustive-deps

  const [inputs, setInputs] = useState<BudgetInputs>(initialInputs);
  const [mode, setMode] = useState<Mode>("monthly");
  const [upfrontOpen, setUpfrontOpen] = useState(false);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);

  const result = useMemo(() => calculateBudget(inputs), [inputs]);
  const totalCost =
    result.downAmount + result.totalMonthly * Math.max(0, inputs.termYears) * 12;
  const estimateInfo = property
    ? getBudgetEstimateForHome(property.id) ??
      budgetEstimateInfo({
        price: inputs.price,
        hoaKnown: true,
        confirmed: scenario?.confirmed ?? false,
      })
    : budgetEstimateInfo({
        price: inputs.price,
        hoaKnown: true,
        confirmed: scenario?.confirmed ?? false,
      });

  function apply(next: BudgetInputs, confirmed = scenario?.confirmed ?? false) {
    setInputs(next);
    saveScenarioInputs(next, property?.id ?? null, confirmed);
  }

  function acceptAssumptions() {
    saveScenarioInputs(inputs, property?.id ?? null, true);
  }

  const breakdownLabels: Record<BudgetBreakdownKey, string> = {
    principalInterest: t("budget.principalInterest"),
    propertyTaxes: t("budget.propertyTaxes"),
    insurance: t("budget.insurance"),
    floodInsurance: t("budget.floodInsurance"),
    mortgageInsurance: t("budget.mortgageInsurance"),
    hoa: t("budget.hoa"),
    maintenance: t("budget.maintenance"),
    other: t("budget.otherMonthly"),
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start gap-3 px-6 pt-8">
        <BackButton onClick={onBack} label={t("common.backToDashboard")} />
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            {t("budget.eyebrow")}
          </p>
          <h1 className="mt-1 font-serif text-[31px] leading-none tracking-[-0.02em] text-ink">
            {t("budget.title")}
          </h1>
        </div>
      </header>

      <div className="px-6 pb-9">
        {property && (
          <div className="mt-4 flex items-center gap-3 rounded-[20px] border border-line bg-white/55 p-3">
            <PropertyPhoto
              home={property}
              className="h-14 w-16 shrink-0 rounded-xl border border-line/70"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                {t("budget.planFor", { address: property.address })}
              </p>
              <p className="mt-1 truncate font-serif text-[16px] leading-tight text-ink">
                {property.address}
              </p>
              <p className="mt-0.5 text-[10px] text-muted">
                {property.city || t("common.cityToConfirm")}
              </p>
            </div>
          </div>
        )}

        <p className="mt-3 text-[12px] leading-5 text-muted">
          {property ? t("budget.planIntro") : t("budget.intro")}
        </p>
        {property && (
          <p className="mt-1 text-[10px] leading-4 text-muted">
            {t("budget.propertyOverrides")}
          </p>
        )}

        <section
          className={[
            "mt-4 rounded-[22px] border px-4 py-3.5",
            estimateInfo.status === "partial"
              ? "border-clay/25 bg-clay/[0.06]"
              : estimateInfo.status === "assumptions"
                ? "border-gold/25 bg-gold/[0.07]"
                : "border-olive/20 bg-olive/[0.06]",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("budget.estimateStatus")}
              </p>
              <p className="mt-1 text-[12px] font-medium text-ink">
                {estimateInfo.status === "complete"
                  ? t("budget.statusComplete")
                  : estimateInfo.status === "assumptions"
                    ? t("budget.statusAssumptions")
                    : t("budget.statusPartial")}
              </p>
            </div>
            <span
              className={[
                "shrink-0 rounded-full px-2 py-0.5 text-[8.5px] uppercase tracking-[0.08em]",
                estimateInfo.status === "partial"
                  ? "bg-clay/10 text-clay"
                  : estimateInfo.status === "assumptions"
                    ? "bg-gold/10 text-[#6b5535]"
                    : "bg-olive/10 text-olive",
              ].join(" ")}
            >
              {estimateInfo.status === "partial"
                ? t("budget.partialBadge")
                : estimateInfo.status === "assumptions"
                  ? t("budget.estimatedBadge")
                  : t("budget.completeBadge")}
            </span>
          </div>

          <p className="mt-1.5 text-[10px] leading-4 text-muted">
            {estimateInfo.status === "complete"
              ? t("budget.statusCompleteBody")
              : estimateInfo.status === "assumptions"
                ? t("budget.statusAssumptionsBody")
                : t("budget.statusPartialBody")}
          </p>

          {estimateInfo.status !== "complete" && (
            <ul className="mt-2 space-y-1">
              {estimateInfo.missing.includes("price") && (
                <li className="text-[9.5px] leading-4 text-clay">
                  · {t("budget.missingPrice")}
                </li>
              )}
              {estimateInfo.missing.includes("hoa") && (
                <li className="text-[9.5px] leading-4 text-clay">
                  · {t("budget.missingHoa")}
                </li>
              )}
              {estimateInfo.assumed.includes("taxes") && (
                <li className="text-[9.5px] leading-4 text-muted">
                  ·{" "}
                  {t("budget.assumptionTaxes", {
                    amount: formatPrice(Math.round(result.breakdown[1].amount), locale),
                  })}
                </li>
              )}
              {estimateInfo.assumed.includes("insurance") && (
                <li className="text-[9.5px] leading-4 text-muted">
                  ·{" "}
                  {t("budget.assumptionInsurance", {
                    amount: formatPrice(Math.round(result.breakdown[2].amount), locale),
                  })}
                </li>
              )}
              {estimateInfo.assumed.includes("maintenance") && (
                <li className="text-[9.5px] leading-4 text-muted">
                  ·{" "}
                  {t("budget.assumptionMaintenance", {
                    amount: formatPrice(Math.round(result.breakdown[6].amount), locale),
                  })}
                </li>
              )}
            </ul>
          )}

          {estimateInfo.status !== "complete" && (
            <button
              type="button"
              onClick={acceptAssumptions}
              className="mt-2.5 min-h-9 rounded-full border border-olive/25 bg-white/60 px-3 text-[10px] font-medium text-olive transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
            >
              {t("budget.acceptAssumptions")}
            </button>
          )}
        </section>

        <div className="mt-4 flex rounded-full border border-line bg-parchment p-1">
          {(
            [
              { id: "monthly", label: t("budget.monthly") },
              { id: "total", label: t("budget.total") },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMode(option.id)}
              aria-pressed={mode === option.id}
              className={[
                "min-h-10 flex-1 rounded-full px-2 text-[11px] transition-colors",
                mode === option.id
                  ? "bg-olive font-medium text-cream shadow-sm"
                  : "text-muted hover:text-ink",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-[26px] border border-line bg-white/50 p-5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
                {t("budget.purchasePrice")}
              </p>
              <p className="mt-1 font-serif text-[28px] leading-none text-ink">
                {formatPrice(result.price, locale)}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-parchment px-2.5 py-1 text-[10px] text-muted">
              {t("budget.downPercent", {
                percent: Math.round(result.downPercent * 10) / 10,
              })}
            </span>
          </div>

          <div className="mt-4">
            <NumberField
              id="budget-price"
              label={t("budget.purchasePrice")}
              value={inputs.price}
              onCommit={(value) => apply(withPrice(inputs, value))}
              prefix="$"
              step="1000"
            />
          </div>

          <input
            type="range"
            min={100_000}
            max={5_000_000}
            step={10_000}
            value={Math.min(5_000_000, Math.max(100_000, inputs.price))}
            onChange={(event) =>
              apply(withPrice(inputs, Number(event.target.value)))
            }
            aria-label={t("budget.homePriceAria")}
            className="range-slider mt-5"
            style={
              {
                "--fill": rangeFill(inputs.price, 100_000, 5_000_000),
              } as CSSProperties
            }
          />
          <div className="mt-2 flex justify-between text-[10px] text-muted">
            <span>{formatPriceShort(100_000, locale)}</span>
            <span>{formatPriceShort(5_000_000, locale)}</span>
          </div>

          <div className="mt-5 border-t border-line/80 pt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[12px] text-ink/85">
                {t("budget.downPayment")}
              </p>
              <p className="text-[11px] tabular-nums text-muted">
                {Math.round(result.downPercent * 10) / 10}% (
                {formatPrice(Math.round(result.downAmount), locale)})
              </p>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={result.downPercent}
              onChange={(event) =>
                apply(withDownPercent(inputs, Number(event.target.value)))
              }
              aria-label={t("budget.downPaymentAria")}
              className="range-slider mt-3"
              style={
                {
                  "--fill": rangeFill(result.downPercent, 0, 100),
                } as CSSProperties
              }
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumberField
                id="budget-down-percent"
                label={t("budget.downPercentLabel")}
                value={Math.round(result.downPercent * 100) / 100}
                onCommit={(value) => apply(withDownPercent(inputs, value))}
                suffix="%"
                step="0.5"
              />
              <NumberField
                id="budget-down-amount"
                label={t("budget.downAmountLabel")}
                value={Math.round(result.downAmount)}
                onCommit={(value) => apply(withDownAmount(inputs, value))}
                prefix="$"
                step="1000"
              />
            </div>
          </div>

          <div className="mt-5 border-t border-line/80 pt-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] text-ink/85">{t("budget.loanTerm")}</p>
              <div className="flex gap-1 rounded-full bg-parchment p-0.5">
                {[15, 20, 30].map((years) => (
                  <button
                    key={years}
                    type="button"
                    onClick={() =>
                      apply({ ...inputs, termYears: years })
                    }
                    aria-pressed={inputs.termYears === years}
                    className={[
                      "min-h-8 rounded-full px-2.5 text-[10px] transition-colors",
                      inputs.termYears === years
                        ? "bg-olive text-cream"
                        : "text-muted hover:text-ink",
                    ].join(" ")}
                  >
                    {t("budget.termYears", { years })}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumberField
                id="budget-term"
                label={t("budget.termLabel")}
                value={inputs.termYears}
                onCommit={(value) =>
                  apply({ ...inputs, termYears: Math.round(value) })
                }
                suffix={locale === "es" ? "años" : "yrs"}
                step="1"
              />
              <NumberField
                id="budget-rate"
                label={t("budget.rateLabel")}
                value={inputs.rate}
                onCommit={(value) => apply({ ...inputs, rate: value })}
                suffix="%"
                step="0.1"
              />
            </div>
          </div>

          <div className="mt-5 border-t border-line/80 pt-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              {t("budget.estimates")}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumberField
                id="budget-taxes"
                label={t("budget.taxes")}
                value={inputs.annualTaxes}
                onCommit={(value) =>
                  apply({ ...inputs, annualTaxes: value })
                }
                prefix="$"
                step="100"
              />
              <NumberField
                id="budget-insurance"
                label={t("budget.insuranceAnnual")}
                value={inputs.annualInsurance}
                onCommit={(value) =>
                  apply({ ...inputs, annualInsurance: value })
                }
                prefix="$"
                step="100"
              />
              <NumberField
                id="budget-hoa"
                label={t("budget.hoaMonthly")}
                value={inputs.monthlyHoa}
                onCommit={(value) =>
                  apply({ ...inputs, monthlyHoa: value })
                }
                prefix="$"
                step="10"
              />
              <NumberField
                id="budget-maintenance"
                label={t("budget.maintenanceMonthly")}
                value={inputs.monthlyMaintenance}
                onCommit={(value) =>
                  apply({ ...inputs, monthlyMaintenance: value })
                }
                prefix="$"
                step="10"
              />
            </div>

            <button
              type="button"
              onClick={() => setAssumptionsOpen((value) => !value)}
              aria-expanded={assumptionsOpen}
              className="mt-3 min-h-9 w-full rounded-full border border-line bg-white/60 text-[10.5px] text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
            >
              {assumptionsOpen
                ? t("budget.hideAssumptions")
                : t("budget.showAssumptions")}
            </button>

            {assumptionsOpen && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <NumberField
                  id="budget-mortgage-insurance"
                  label={t("budget.mortgageInsurance")}
                  value={inputs.monthlyMortgageInsurance}
                  onCommit={(value) =>
                    apply({ ...inputs, monthlyMortgageInsurance: value })
                  }
                  prefix="$"
                  step="10"
                />
                <NumberField
                  id="budget-flood-insurance"
                  label={t("budget.floodInsurance")}
                  value={inputs.monthlyFloodInsurance}
                  onCommit={(value) =>
                    apply({ ...inputs, monthlyFloodInsurance: value })
                  }
                  prefix="$"
                  step="10"
                />
                <NumberField
                  id="budget-other"
                  label={t("budget.otherMonthly")}
                  value={inputs.monthlyOther}
                  onCommit={(value) =>
                    apply({ ...inputs, monthlyOther: value })
                  }
                  prefix="$"
                  step="10"
                />
                <NumberField
                  id="budget-target"
                  label={t("budget.target")}
                  value={inputs.targetMonthly}
                  onCommit={(value) =>
                    apply({ ...inputs, targetMonthly: value })
                  }
                  prefix="$"
                  step="50"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-[26px] bg-olive p-5 text-cream">
          <p className="text-[10px] uppercase tracking-[0.18em] text-cream/75">
            {mode === "monthly"
              ? t("budget.estimatedMonthly")
              : t("budget.totalOverYears", { years: inputs.termYears })}
          </p>
          <p className="mt-2 font-serif text-[38px] leading-none tracking-[-0.02em]">
            {formatPrice(
              Math.round(mode === "monthly" ? result.totalMonthly : totalCost),
              locale,
            )}
          </p>
          <p className="mt-2 text-[10px] leading-4 text-cream/80">
            {mode === "monthly"
              ? t("budget.includesMonthly")
              : t("budget.includesTotal")}
          </p>

          <div className="mt-5 border-t border-cream/15 pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-cream/80">
                {t("budget.affordability")}
              </p>
              <p className="text-[11px] tabular-nums text-cream/85">
                {result.differenceFromTarget === null
                  ? t("budget.noTarget")
                  : result.differenceFromTarget > 0
                    ? t("budget.overTarget", {
                        amount: formatPrice(
                          Math.round(result.differenceFromTarget),
                          locale,
                        ),
                      })
                    : t("budget.underTarget", {
                        amount: formatPrice(
                          Math.round(Math.abs(result.differenceFromTarget)),
                          locale,
                        ),
                      })}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <p className="text-cream/80">{t("budget.annual")}</p>
                <p className="mt-1 tabular-nums text-cream">
                  {formatPrice(Math.round(result.annualCost), locale)}
                </p>
              </div>
              <div>
                <p className="text-cream/80">{t("budget.upfront")}</p>
                <p className="mt-1 tabular-nums text-cream">
                  {formatPrice(Math.round(result.upfrontCash), locale)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[9px] leading-4 text-cream/80">
              {t("budget.upfrontDetail")}
            </p>
          </div>

          <div className="mt-5 border-t border-cream/15 pt-4">
            <p className="text-[9px] uppercase tracking-[0.16em] text-cream/80">
              {t("budget.monthlyBreakdown")}
            </p>
            <div className="mt-3 space-y-2.5">
              {result.breakdown.map((item) => (
                <div
                  key={item.key}
                  className="flex items-baseline justify-between gap-3 text-[11px]"
                >
                  <span className="text-cream/80">
                    {breakdownLabels[item.key]}
                  </span>
                  <span className="tabular-nums text-cream">
                    {formatPrice(Math.round(item.amount), locale)}
                  </span>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-3 border-t border-cream/15 pt-2.5 text-[12px]">
                <span className="text-cream/80">
                  {t("budget.estimatedTotal")}
                </span>
                <span className="font-medium tabular-nums text-cream">
                  {formatPrice(Math.round(result.totalMonthly), locale)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 border-t border-cream/15 pt-4">
            <div className="flex items-baseline justify-between text-[11px]">
              <span className="text-cream/80">{t("budget.loanAmount")}</span>
              <span className="tabular-nums text-cream">
                {formatPrice(Math.round(result.loanAmount), locale)}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-[11px]">
              <span className="text-cream/80">{t("budget.totalInterest")}</span>
              <span className="tabular-nums text-cream">
                {formatPrice(Math.round(result.totalInterest), locale)}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-[11px]">
              <span className="text-cream/80">
                {t("budget.downPaymentShort")}
              </span>
              <span className="tabular-nums text-cream">
                {formatPrice(Math.round(result.downAmount), locale)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setUpfrontOpen((value) => !value)}
            className="mt-4 min-h-10 w-full rounded-full border border-cream/20 bg-cream/5 py-2.5 text-[11px] font-medium text-cream transition-colors hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/40"
          >
            {upfrontOpen
              ? t("budget.hideUpfront")
              : t("budget.showUpfront")}
          </button>

          {upfrontOpen && (
            <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
              {(
                [
                  ["closingCosts", t("budget.closingCosts")],
                  ["inspection", t("budget.inspection")],
                  ["appraisal", t("budget.appraisal")],
                  ["moving", t("budget.moving")],
                  ["initialRepairs", t("budget.initialRepairs")],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block">
                  <span className="text-[9px] text-cream/80">{label}</span>
                  <input
                    value={String(inputs[key])}
                    onChange={(event) => {
                      const parsed = Number(event.target.value);
                      if (!Number.isFinite(parsed) || parsed < 0) return;
                      apply({ ...inputs, [key]: parsed });
                    }}
                    type="number"
                    min={0}
                    step="10"
                    inputMode="numeric"
                    className="mt-1 w-full rounded-xl border border-cream/20 bg-cream/10 px-3 py-2 text-[11px] tabular-nums text-cream outline-none focus:border-cream/50"
                    aria-label={label}
                  />
                </label>
              ))}
            </div>
          )}

          <p className="mt-4 border-t border-cream/15 pt-3 text-[9px] leading-4 text-cream/80">
            {t("budget.estimateNote")}
          </p>
        </div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-muted">
          <CheckIcon className="h-3 w-3 text-olive" />
          {t("budget.autoSaved")}
        </p>
      </div>
    </div>
  );
}
