"use client";

import { useState, type FormEvent } from "react";
import { useAppData } from "../../lib/app-data";
import { formatPrice, type Home } from "../../lib/homes";
import { BackButton } from "../back-button";
import { HouseIllustration } from "../house-illustration";
import {
  CheckIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
} from "../icons";

const RATING_LABELS = [
  "Not for us",
  "Needs work",
  "Worth a look",
  "Strong contender",
  "Loved it",
];

export function TourNotesScreen({
  home,
  onBack,
}: {
  home: Home;
  onBack: () => void;
}) {
  const { tourNotes, saveTourNote } = useAppData();
  const existing = tourNotes[home.id];
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [pros, setPros] = useState<string[]>(existing?.pros ?? []);
  const [cons, setCons] = useState<string[]>(existing?.cons ?? []);
  const [saved, setSaved] = useState(Boolean(existing?.updatedAt));

  function updateRating(value: number) {
    setRating(value);
    setSaved(false);
  }

  function save() {
    saveTourNote(home.id, { rating, notes, pros, cons });
    setSaved(true);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start gap-3 px-6 pt-8">
        <BackButton onClick={onBack} label="Go back" />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            Your impressions
          </p>
          <h1 className="mt-1 font-serif text-[31px] leading-none tracking-[-0.02em] text-ink">
            Tour Notes
          </h1>
        </div>
      </header>

      <div className="px-6 pb-9">
        <div className="mt-5 flex items-center gap-3 rounded-[22px] border border-line bg-white/50 p-3">
          <div className="h-14 w-16 shrink-0 overflow-hidden rounded-xl border border-line/70">
            <div
              className="h-full w-full"
              style={{ filter: home.imageFilter }}
            >
              <HouseIllustration className="h-full w-full" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-ink">
              {home.address}
            </p>
            <p className="mt-1 text-[10px] text-muted">
              {home.beds} beds <span className="px-0.5">·</span> {home.baths}{" "}
              baths <span className="px-0.5">·</span>{" "}
              {home.sqft.toLocaleString("en-US")} sq ft
            </p>
          </div>
          <p className="shrink-0 font-serif text-[14px] text-ink">
            {formatPrice(home.price)}
          </p>
        </div>

        <section className="mt-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-[19px] text-ink">
              How did it feel?
            </h2>
            <span className="text-[10px] uppercase tracking-[0.12em] text-olive">
              {rating > 0 ? RATING_LABELS[rating - 1] : "Not rated yet"}
            </span>
          </div>

          <div className="mt-3 flex gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => updateRating(value)}
                aria-label={`Rate ${value} out of 5`}
                aria-pressed={rating === value}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white/50 text-muted transition-colors hover:border-olive/30 hover:bg-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
              >
                <StarIcon
                  className={[
                    "h-[19px] w-[19px]",
                    value <= rating ? "fill-gold text-gold" : "text-muted/45",
                  ].join(" ")}
                />
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-[19px] text-ink">Notes</h2>
            <span className="text-[10px] text-muted">
              {saved ? "Saved" : "Tap to edit"}
            </span>
          </div>
          <textarea
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setSaved(false);
            }}
            rows={5}
            aria-label="Tour notes"
            placeholder="What stood out? What would you change?"
            className="mt-3 w-full resize-none rounded-[20px] border border-line bg-white/60 px-4 py-3.5 text-[12.5px] leading-6 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-olive/35 focus:ring-2 focus:ring-olive/15"
          />
        </section>

        <ListEditor
          className="mt-6"
          title="What you loved"
          tone="pro"
          items={pros}
          placeholder="Add something you loved…"
          onChange={(items) => {
            setPros(items);
            setSaved(false);
          }}
        />

        <ListEditor
          className="mt-5"
          title="What gave you pause"
          tone="con"
          items={cons}
          placeholder="Add a concern…"
          onChange={(items) => {
            setCons(items);
            setSaved(false);
          }}
        />

        <button
          type="button"
          onClick={save}
          className={[
            "mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
            saved
              ? "bg-olive/10 text-olive"
              : "bg-olive text-cream hover:bg-olive-deep",
          ].join(" ")}
        >
          {saved ? (
            <>
              <CheckIcon className="h-4 w-4" />
              Notes Saved
            </>
          ) : (
            "Save Tour Notes"
          )}
        </button>
      </div>
    </div>
  );
}

function ListEditor({
  title,
  items,
  onChange,
  placeholder,
  tone,
  className = "",
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  tone: "pro" | "con";
  className?: string;
}) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    onChange([...items, value]);
    setDraft("");
    setAdding(false);
  }

  return (
    <section className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-[19px] text-ink">{title}</h2>
        <button
          type="button"
          onClick={() => setAdding((value) => !value)}
          className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-olive transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
        >
          <PlusIcon className="h-3 w-3" />
          Add
        </button>
      </div>

      <div className="mt-3 overflow-hidden rounded-[20px] border border-line bg-white/50">
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className={[
              "flex items-center gap-2.5 px-4 py-3",
              index > 0 ? "border-t border-line/70" : "",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={[
                "h-1.5 w-1.5 shrink-0 rounded-full",
                tone === "pro" ? "bg-olive/70" : "bg-gold",
              ].join(" ")}
            />
            <span className="min-w-0 flex-1 text-[12px] leading-5 text-ink/85">
              {item}
            </span>
            <button
              type="button"
              onClick={() =>
                onChange(items.filter((_, itemIndex) => itemIndex !== index))
              }
              aria-label={`Remove ${item}`}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted/60 transition-colors hover:bg-parchment hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {adding ? (
          <form
            onSubmit={submit}
            className={[
              "flex items-center gap-2 p-2 pl-4",
              items.length > 0 ? "border-t border-line/70" : "",
            ].join(" ")}
          >
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted/70"
            />
            <button
              type="submit"
              className="rounded-full bg-olive px-3 py-1.5 text-[10px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
            >
              Add
            </button>
          </form>
        ) : (
          items.length === 0 && (
            <p className="px-4 py-4 text-[11px] text-muted">
              Nothing added yet.
            </p>
          )
        )}
      </div>
    </section>
  );
}
