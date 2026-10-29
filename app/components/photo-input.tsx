"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";
import { compressImageFile } from "../lib/image";
import { useI18n } from "../lib/i18n";
import { UploadIcon, XIcon } from "./icons";

export function PhotoInput({
  value,
  onChange,
  label,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
}) {
  const { t } = useI18n();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const compressed = await compressImageFile(file);
      onChange(compressed);
    } catch {
      setError(t("property.photoError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
        {label ?? t("property.photoUpload")}
      </p>

      <div className="mt-2 flex items-center gap-3">
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border border-line bg-parchment">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted">
              <UploadIcon className="h-6 w-6" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            className="sr-only"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-white/70 px-3.5 text-[11px] font-medium text-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40 disabled:opacity-60"
            >
              <UploadIcon className="h-3.5 w-3.5 text-olive" />
              {busy ? t("common.saving") : t("common.change")}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 text-[11px] text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
              >
                <XIcon className="h-3 w-3" />
                {t("property.removePhoto")}
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[10px] leading-4 text-muted">
            {t("property.photoHint")}
          </p>
          {error && <p className="mt-1 text-[10px] text-gold">{error}</p>}
        </div>
      </div>
    </div>
  );
}
