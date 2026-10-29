"use client";

import { useId, useState, type FormEvent } from "react";
import { useAppData } from "../../lib/app-data";
import { formatPriceOrPending, type Home } from "../../lib/homes";
import { useI18n, type TranslationKey } from "../../lib/i18n";
import { BackButton } from "../back-button";
import { HouseIllustration } from "../house-illustration";
import {
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
} from "../icons";

const RATING_KEYS: TranslationKey[] = [
  "tour.rating1",
  "tour.rating2",
  "tour.rating3",
  "tour.rating4",
  "tour.rating5",
];

export function TourNotesScreen({
  home,
  homes,
  onSelectHome,
  onBack,
}: {
  home: Home;
  homes: Home[];
  onSelectHome: (homeId: string) => void;
  onBack: () => void;
}) {
  const { tourNotes, saveTourNote } = useAppData();
  const { t, locale, number } = useI18n();
  const existing = tourNotes[home.id];
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [pros, setPros] = useState<string[]>(existing?.pros ?? []);
  const [cons, setCons] = useState<string[]>(existing?.cons ?? []);
  const [saved, setSaved] = useState(Boolean(existing?.updatedAt));
  const [pendingHomeId, setPendingHomeId] = useState<string | null>(null);
  const homeSelectId = useId();

  const dirty =
    rating !== (existing?.rating ?? 0) ||
    notes !== (existing?.notes ?? "") ||
    JSON.stringify(pros) !== JSON.stringify(existing?.pros ?? []) ||
    JSON.stringify(cons) !== JSON.stringify(existing?.cons ?? []);
  const pendingHome =
    pendingHomeId && pendingHomeId !== home.id
      ? homes.find((option) => option.id === pendingHomeId)
      : undefined;

  function updateRating(value: number) {
    setRating(value);
    setSaved(false);
  }

  function save() {
    saveTourNote(home.id, { rating, notes, pros, cons });
    setSaved(true);
  }

  function requestHomeChange(nextId: string) {
    if (nextId === home.id) return;
    // Switching remounts the editor for the new home, so keep unsaved work
    // from disappearing without a decision.
    if (dirty) {
      setPendingHomeId(nextId);
      return;
    }
    onSelectHome(nextId);
  }

  function confirmHomeChange() {
    if (!pendingHomeId) return;
    const nextId = pendingHomeId;
    setPendingHomeId(null);
    onSelectHome(nextId);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start gap-3 px-6 pt-8">
        <BackButton onClick={onBack} label={t("common.goBack")} />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            {t("tour.eyebrow")}
          </p>
          <h1 className="mt-1 font-serif text-[31px] leading-none tracking-[-0.02em] text-ink">
            {t("tour.title")}
          </h1>
        </div>
      </header>

      <div className="px-6 pb-9">
        <label
          htmlFor={homeSelectId}
          className="mt-5 block text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
        >
          {t("tour.home")}
        </label>

        <div className="relative mt-2">
          <select
            id={homeSelectId}
            value={home.id}
            onChange={(event) => requestHomeChange(event.target.value)}
            aria-label={t("tour.chooseHome")}
            className="w-full appearance-none rounded-2xl border border-line bg-white/60 py-3 pl-4 pr-10 text-[13px] text-ink outline-none transition-colors focus:border-olive/35 focus:ring-2 focus:ring-olive/15"
          >
            {homes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.address}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/70" />
        </div>

        {pendingHome && (
          <div
            role="alertdialog"
            aria-label={t("tour.switchTitle", {
              address: pendingHome.address,
            })}
            className="mt-3 rounded-2xl border border-line bg-parchment px-4 py-3.5"
          >
            <p className="text-[12px] font-medium leading-5 text-ink">
              {t("tour.switchTitle", { address: pendingHome.address })}
            </p>
            <p className="mt-1 text-[10.5px] leading-4 text-muted">
              {t("tour.switchBody", { address: home.address })}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setPendingHomeId(null)}
                className="flex-1 rounded-full border border-line bg-white/70 py-2.5 text-[11px] font-medium text-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/30"
              >
                {t("tour.keepEditing")}
              </button>
              <button
                type="button"
                onClick={confirmHomeChange}
                className="flex-1 rounded-full bg-olive py-2.5 text-[11px] font-medium text-cream transition-colors hover:bg-olive-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
              >
                {t("tour.switchHome")}
              </button>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center gap-3 rounded-[22px] border border-line bg-white/50 p-3">
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
              {home.beds > 0
                ? t("dashboard.bedsValue", { count: home.beds })
                : t("dashboard.bedsEmpty")}{" "}
              <span className="px-0.5">·</span>{" "}
              {home.baths > 0
                ? t("dashboard.bathsValue", { count: home.baths })
                : t("dashboard.bathsEmpty")}{" "}
              <span className="px-0.5">·</span>{" "}
              {home.sqft > 0
                ? t("dashboard.sqftValue", { value: number(home.sqft) })
                : t("dashboard.sqftEmpty")}
            </p>
          </div>
          <p className="shrink-0 font-serif text-[14px] text-ink">
            {formatPriceOrPending(home.price, locale)}
          </p>
        </div>

        <section className="mt-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-[19px] text-ink">
              {t("tour.howFeel")}
            </h2>
            <span className="text-[10px] uppercase tracking-[0.12em] text-olive">
              {rating > 0
                ? t(RATING_KEYS[rating - 1])
                : t("tour.notRated")}
            </span>
          </div>

          <div className="mt-3 flex gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => updateRating(value)}
                aria-label={t("tour.rate", { value })}
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
            <h2 className="font-serif text-[19px] text-ink">
              {t("tour.notes")}
            </h2>
            <span className="text-[10px] text-muted">
              {saved ? t("common.saved") : t("tour.tapToEdit")}
            </span>
          </div>
          <textarea
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setSaved(false);
            }}
            rows={5}
            aria-label={t("tour.notesAria")}
            placeholder={t("tour.notesPlaceholder")}
            className="mt-3 w-full resize-none rounded-[20px] border border-line bg-white/60 px-4 py-3.5 text-[12.5px] leading-6 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-olive/35 focus:ring-2 focus:ring-olive/15"
          />
        </section>

        <ListEditor
          className="mt-6"
          title={t("tour.loved")}
          tone="pro"
          items={pros}
          placeholder={t("tour.lovedPlaceholder")}
          onChange={(items) => {
            setPros(items);
            setSaved(false);
          }}
        />

        <ListEditor
          className="mt-5"
          title={t("tour.pause")}
          tone="con"
          items={cons}
          placeholder={t("tour.pausePlaceholder")}
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
              {t("tour.notesSaved")}
            </>
          ) : (
            t("tour.saveNotes")
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
  const { t } = useI18n();
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
          {t("common.add")}
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
              aria-label={t("tour.removeItem", { item })}
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
              {t("common.add")}
            </button>
          </form>
        ) : (
          items.length === 0 && (
            <p className="px-4 py-4 text-[11px] text-muted">
              {t("tour.nothingAdded")}
            </p>
          )
        )}
      </div>
    </section>
  );
}
