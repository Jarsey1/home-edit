"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useAppData } from "../../lib/app-data";
import { formatPriceOrPending, type Home } from "../../lib/homes";
import { HouseIllustration } from "../house-illustration";
import { CheckIcon, PlusIcon } from "../icons";

type Row = {
  label: string;
  values: (string | number | boolean)[];
};

function buildRows(homes: Home[], expanded: boolean): Row[] {
  const rows: Row[] = [
    {
      label: "Bedrooms",
      values: homes.map((home) => (home.beds > 0 ? home.beds : "—")),
    },
    {
      label: "Bathrooms",
      values: homes.map((home) => (home.baths > 0 ? home.baths : "—")),
    },
    {
      label: "Square feet",
      values: homes.map((home) =>
        home.sqft > 0 ? home.sqft.toLocaleString("en-US") : "—",
      ),
    },
    { label: "Lot size", values: homes.map((home) => home.lot || "—") },
    { label: "Garage", values: homes.map((home) => home.garage || "—") },
    { label: "Pool", values: homes.map((home) => home.pool) },
    { label: "Gated", values: homes.map((home) => home.gated) },
    {
      label: "HOA fee",
      values: homes.map((home) => (home.hoa > 0 ? `$${home.hoa}` : "—")),
    },
  ];

  if (expanded) {
    rows.push(
      {
        label: "Year built",
        values: homes.map((home) => (home.yearBuilt > 0 ? home.yearBuilt : "—")),
      },
      { label: "Type", values: homes.map((home) => home.type || "—") },
      {
        label: "Days listed",
        values: homes.map((home) =>
          home.daysOnMarket > 0 ? home.daysOnMarket : "—",
        ),
      },
    );
  }

  return rows;
}

export function CompareScreen({
  onOpenProperty,
}: {
  onOpenProperty: (homeId: string) => void;
}) {
  const { homes, comparisonNotes, addComparisonNote } = useAppData();
  const [expanded, setExpanded] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const rows = buildRows(homes, expanded);
  const columns = Math.max(homes.length, 1);
  const scrolls = homes.length > 3;
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `76px repeat(${columns}, minmax(0, 1fr))`,
    ...(scrolls ? { minWidth: 76 + columns * 96 } : {}),
  };

  function submitNote(event: FormEvent) {
    event.preventDefault();
    if (!noteDraft.trim()) return;
    addComparisonNote(noteDraft);
    setNoteDraft("");
    setAddingNote(false);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start justify-between px-6 pt-8">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            Saved homes
          </p>
          <h1 className="mt-1 font-serif text-[31px] leading-none tracking-[-0.02em] text-ink">
            Compare Homes
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setAddingNote((value) => !value)}
          className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-olive px-3.5 py-2.5 text-[11px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add
        </button>
      </header>

      {addingNote && (
        <form
          onSubmit={submitNote}
          className="mx-6 mt-4 flex items-center gap-2 rounded-2xl border border-line bg-white/60 p-2 pl-4"
        >
          <input
            autoFocus
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder="Add a note about these homes…"
            aria-label="Comparison note"
            className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted/70"
          />
          <button
            type="submit"
            className="rounded-full bg-olive px-3 py-2 text-[10px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
          >
            Add
          </button>
        </form>
      )}

      {comparisonNotes.length > 0 && (
        <div className="mx-6 mt-4 rounded-2xl border border-line bg-parchment px-4 py-3.5">
          <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted">
            Comparison notes
          </p>
          <ul className="mt-2 space-y-1.5">
            {comparisonNotes.map((note) => (
              <li
                key={note.id}
                className="text-[11px] leading-4 text-ink/85"
              >
                {note.body}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="px-6 pb-9 pt-5">
        <div
          className="-mx-6 overflow-x-auto px-6"
          role="region"
          aria-label="Home comparison"
          tabIndex={0}
        >
          <div className="grid" style={gridStyle}>
            <div aria-hidden="true" />

            {homes.map((home) => (
              <button
                key={home.id}
                type="button"
                onClick={() => onOpenProperty(home.id)}
                aria-label={`View ${home.address}`}
                className="min-w-0 px-1 pb-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
              >
                <div className="relative h-[68px] w-full overflow-hidden rounded-xl border border-line/80">
                  <div
                    className="h-full w-full"
                    style={{ filter: home.imageFilter }}
                  >
                    <HouseIllustration className="h-full w-full" />
                  </div>
                  <span className="absolute right-1 top-1 rounded-full bg-cream/95 px-1.5 py-0.5 text-[8px] font-medium text-olive backdrop-blur">
                    {home.match > 0 ? `${home.match}%` : "New"}
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-medium leading-[1.2] text-ink">
                  {home.address}
                </p>
                <p className="mt-1 whitespace-nowrap text-[9.5px] text-muted">
                  {formatPriceOrPending(home.price)}
                </p>
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-[20px] border border-line bg-white/45">
            {rows.map((row, rowIndex) => (
              <div
                key={row.label}
                className={[
                  "grid items-center",
                  rowIndex > 0 ? "border-t border-line/70" : "",
                ].join(" ")}
                style={gridStyle}
              >
                <div className="px-2.5 py-3 text-[10px] leading-[1.35] text-muted">
                  {row.label}
                </div>
                {row.values.map((value, index) => (
                  <div
                    key={`${row.label}-${homes[index]?.id ?? index}`}
                    className="border-l border-line/50 px-1 py-3 text-center text-[11px] tabular-nums text-ink/90"
                  >
                    {typeof value === "boolean" ? (
                      value ? (
                        <CheckIcon className="mx-auto h-4 w-4 text-olive" />
                      ) : (
                        <span className="text-muted/60">—</span>
                      )
                    ) : (
                      value
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-3 text-center text-[10px] text-muted">
          {scrolls
            ? "Swipe sideways to compare every home, or tap one for details."
            : "Tap any home to see the full listing."}
        </p>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-5 w-full rounded-full bg-olive py-3.5 text-[13px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          {expanded ? "Show Less" : "View Full Comparison"}
        </button>
      </div>
    </div>
  );
}
