"use client";

import { useI18n } from "../lib/i18n";
import { ArrowLeftIcon } from "./icons";

export function BackButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label?: string;
}) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? t("common.goBack")}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-parchment/70 text-olive transition-colors hover:border-olive/30 hover:bg-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
    >
      <ArrowLeftIcon className="h-[18px] w-[18px]" />
    </button>
  );
}
