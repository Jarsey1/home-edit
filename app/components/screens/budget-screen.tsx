"use client";

import { useState, type CSSProperties } from "react";
import { useAppData } from "../../lib/app-data";
import { BackButton } from "../back-button";
import { formatPrice, formatPriceShort } from "../../lib/homes";

type Mode = "monthly" | "total";

function rangeFill(value: number, min: number, max: number) {
  return `${((value - min) / (max - min)) * 100}%`;
}

function mortgagePayment(loan: number, annualRate: number, years: number) {
  const monthlyRate = annualRate / 100 / 12;
  const payments = years * 12;
  if (monthlyRate === 0) return loan / payments;
  return (
    (loan * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -payments))
  );
}

export function BudgetScreen({ onBack }: { onBack: () => void }) {
  const { budget, updateBudget } = useAppData();
  const { price, downPercent, term, rate } = budget;
  const [mode, setMode] = useState<Mode>("monthly");
  const [expanded, setExpanded] = useState(false);

  const downPayment = (price * downPercent) / 100;
  const loan = price - downPayment;
  const principalAndInterest = mortgagePayment(loan, rate, term);
  const taxes = (price * 0.0072) / 12;
  const insurance = (price * 0.0024) / 12;
  const hoa = 350;
  const maintenance = (price * 0.0013) / 12;
  const monthly =
    principalAndInterest + taxes + insurance + hoa + maintenance;
  const totalCost = downPayment + monthly * term * 12;
  const totalInterest = principalAndInterest * term * 12 - loan;

  const breakdown = [
    { label: "Principal & interest", value: principalAndInterest },
    { label: "Property taxes", value: taxes },
    { label: "Homeowners insurance", value: insurance },
    { label: "HOA fees", value: hoa },
    { label: "Estimated maintenance", value: maintenance },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start gap-3 px-6 pt-8">
        <BackButton onClick={onBack} label="Back to dashboard" />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            The real number
          </p>
          <h1 className="mt-1 font-serif text-[31px] leading-none tracking-[-0.02em] text-ink">
            Budget Planner
          </h1>
        </div>
      </header>

      <div className="px-6 pb-9">
        <p className="mt-3 text-[12px] leading-5 text-muted">
          See what the monthly payment would really look like.
        </p>

        <div className="mt-5 flex rounded-full border border-line bg-parchment p-1">
          {(
            [
              { id: "monthly", label: "Monthly Payment" },
              { id: "total", label: "Total Cost" },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMode(option.id)}
              className={[
                "flex-1 rounded-full px-2 py-2.5 text-[11px] transition-colors",
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
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
                Home Price
              </p>
              <p className="mt-1 font-serif text-[28px] leading-none text-ink">
                {formatPrice(price)}
              </p>
            </div>
            <span className="rounded-full bg-parchment px-2.5 py-1 text-[10px] text-muted">
              {downPercent}% down
            </span>
          </div>

          <input
            type="range"
            min={500_000}
            max={3_000_000}
            step={25_000}
            value={price}
            onChange={(event) =>
              updateBudget({ price: Number(event.target.value) })
            }
            aria-label="Home price"
            className="range-slider mt-5"
            style={
              {
                "--fill": rangeFill(price, 500_000, 3_000_000),
              } as CSSProperties
            }
          />
          <div className="mt-2 flex justify-between text-[10px] text-muted">
            <span>{formatPriceShort(500_000)}</span>
            <span>{formatPriceShort(3_000_000)}</span>
          </div>

          <div className="mt-5 border-t border-line/80 pt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[12px] text-ink/85">Down Payment</p>
              <p className="text-[11px] tabular-nums text-muted">
                {downPercent}% ({formatPrice(downPayment)})
              </p>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={downPercent}
              onChange={(event) =>
                updateBudget({ downPercent: Number(event.target.value) })
              }
              aria-label="Down payment"
              className="range-slider mt-3"
              style={
                { "--fill": rangeFill(downPercent, 5, 50) } as CSSProperties
              }
            />
          </div>

          <div className="mt-5 border-t border-line/80 pt-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] text-ink/85">Loan Term</p>
              <div className="flex gap-1 rounded-full bg-parchment p-0.5">
                {[15, 20, 30].map((years) => (
                  <button
                    key={years}
                    type="button"
                    onClick={() => updateBudget({ term: years })}
                    className={[
                      "rounded-full px-2.5 py-1.5 text-[10px] transition-colors",
                      term === years
                        ? "bg-olive text-cream"
                        : "text-muted hover:text-ink",
                    ].join(" ")}
                  >
                    {years}y
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-line/80 pt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[12px] text-ink/85">Interest Rate</p>
              <p className="text-[11px] tabular-nums text-muted">
                {rate.toFixed(1)}%
              </p>
            </div>
            <input
              type="range"
              min={2}
              max={8}
              step={0.1}
              value={rate}
              onChange={(event) =>
                updateBudget({ rate: Number(event.target.value) })
              }
              aria-label="Interest rate"
              className="range-slider mt-3"
              style={{ "--fill": rangeFill(rate, 2, 8) } as CSSProperties}
            />
            <div className="mt-2 flex justify-between text-[10px] text-muted">
              <span>2%</span>
              <span>8%</span>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[26px] bg-olive p-5 text-cream">
          <p className="text-[10px] uppercase tracking-[0.18em] text-cream/60">
            {mode === "monthly"
              ? "Estimated Monthly Payment"
              : `Total Cost Over ${term} Years`}
          </p>
          <p className="mt-2 font-serif text-[38px] leading-none tracking-[-0.02em]">
            {formatPrice(
              Math.round(mode === "monthly" ? monthly : totalCost),
            )}
          </p>
          <p className="mt-2 text-[10px] leading-4 text-cream/55">
            {mode === "monthly"
              ? "Includes taxes, insurance, HOA and maintenance."
              : "Includes down payment, loan payments and monthly costs."}
          </p>

          <div className="mt-5 border-t border-cream/15 pt-4">
            <p className="text-[9px] uppercase tracking-[0.16em] text-cream/45">
              Monthly breakdown
            </p>
            <div className="mt-3 space-y-2.5">
              {breakdown.map((item) => (
                <div
                  key={item.label}
                  className="flex items-baseline justify-between gap-3 text-[11px]"
                >
                  <span className="text-cream/65">{item.label}</span>
                  <span className="tabular-nums text-cream">
                    {formatPrice(Math.round(item.value))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {expanded && (
            <div className="mt-4 space-y-2.5 border-t border-cream/15 pt-4">
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-cream/65">Loan amount</span>
                <span className="tabular-nums">{formatPrice(loan)}</span>
              </div>
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-cream/65">Total interest</span>
                <span className="tabular-nums">
                  {formatPrice(Math.round(totalInterest))}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-cream/65">Down payment</span>
                <span className="tabular-nums">
                  {formatPrice(Math.round(downPayment))}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-5 w-full rounded-full border border-cream/20 bg-cream/5 py-3 text-[11px] font-medium text-cream transition-colors hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/40"
          >
            {expanded ? "Hide Full Breakdown" : "View Full Breakdown"}
          </button>
        </div>
      </div>
    </div>
  );
}
