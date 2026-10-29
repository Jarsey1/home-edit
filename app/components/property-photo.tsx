"use client";

import { HouseIllustration } from "./house-illustration";
import type { Home } from "../lib/homes";
import { useI18n } from "../lib/i18n";

export function PropertyPhoto({
  home,
  className = "",
  imageClassName = "",
  filter = true,
}: {
  home: Home;
  className?: string;
  imageClassName?: string;
  filter?: boolean;
}) {
  const { t } = useI18n();

  if (home.photo) {
    return (
      <span className={["block overflow-hidden bg-sand", className].join(" ")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={home.photo}
          alt={t("property.photoAlt", { address: home.address })}
          className={["h-full w-full object-cover", imageClassName].join(" ")}
        />
      </span>
    );
  }

  return (
    <span className={["block overflow-hidden", className].join(" ")}>
      <span
        className="block h-full w-full"
        style={filter ? { filter: home.imageFilter } : undefined}
      >
        <HouseIllustration className="h-full w-full" />
      </span>
    </span>
  );
}
