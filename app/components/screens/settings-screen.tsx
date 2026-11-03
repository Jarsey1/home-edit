"use client";

import { useState } from "react";
import { useAppData } from "../../lib/app-data";
import { useI18n } from "../../lib/i18n";
import { BackButton } from "../back-button";
import { Sheet } from "../sheet";
import { TrashIcon } from "../icons";

const fieldClass =
  "w-full rounded-xl border border-line bg-white/75 px-3 py-2.5 text-[12px] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-olive/35 focus:ring-2 focus:ring-olive/15";

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const {
    user,
    updateDisplayName,
    sendPasswordReset,
    deleteAccount,
    signOut,
  } = useAppData();
  const { t, locale, setLocale } = useI18n();
  const [displayName, setDisplayName] = useState(
    String(
      user?.user_metadata?.display_name ??
        user?.user_metadata?.full_name ??
        user?.user_metadata?.name ??
        "",
    ),
  );
  const [message, setMessage] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const provider = user?.app_metadata?.provider ?? "email";
  const hasEmailIdentity =
    provider === "email" ||
    (user?.identities ?? []).some((identity) => identity.provider === "email");

  async function saveDisplayName() {
    const result = await updateDisplayName(displayName);
    setMessage(result.ok ? t("settings.displayNameSaved") : result.error ?? "");
  }

  async function resetPassword() {
    const result = await sendPasswordReset();
    setMessage(
      result.ok ? t("settings.resetSent") : result.error ?? t("settings.error"),
    );
  }

  async function confirmDelete() {
    if (deleteText !== "DELETE" || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError("");
    const result = await deleteAccount();
    setDeleteBusy(false);
    if (!result.ok) {
      setDeleteError(result.error ?? t("settings.deleteError"));
      return;
    }
    setDeleteOpen(false);
    onBack();
  }

  const privacyUrl = process.env.NEXT_PUBLIC_PRIVACY_URL;
  const termsUrl = process.env.NEXT_PUBLIC_TERMS_URL;
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start gap-3 px-6 pt-8">
        <BackButton onClick={onBack} label={t("common.goBack")} />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            {t("settings.eyebrow")}
          </p>
          <h1 className="mt-1 font-serif text-[30px] leading-none tracking-[-0.02em] text-ink">
            {t("settings.title")}
          </h1>
        </div>
      </header>

      <div className="px-6 pb-10 pt-5">
        {!user ? (
          <div className="rounded-[22px] border border-line bg-white/55 px-4 py-4">
            <p className="text-[12px] font-medium text-ink">
              {t("settings.signInTitle")}
            </p>
            <p className="mt-1 text-[10.5px] leading-4 text-muted">
              {t("settings.signInBody")}
            </p>
          </div>
        ) : (
          <>
            <section className="rounded-[24px] border border-line bg-white/55 p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("settings.accountInfo")}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-olive text-[15px] font-medium text-cream">
                  {(displayName || user.email || "?").slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-ink">
                    {displayName || user.email}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-muted">
                    {user.email}
                  </p>
                </div>
              </div>

              <label className="mt-4 block">
                <span className="text-[10px] text-muted">
                  {t("settings.displayName")}
                </span>
                <div className="mt-1.5 flex gap-2">
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className={fieldClass}
                    autoComplete="name"
                  />
                  <button
                    type="button"
                    onClick={() => void saveDisplayName()}
                    className="min-h-10 shrink-0 rounded-full bg-olive px-3 text-[10px] font-medium text-cream"
                  >
                    {t("common.save")}
                  </button>
                </div>
              </label>

              <p className="mt-3 text-[10px] text-muted">
                {t("settings.provider")}:{" "}
                <span className="font-medium text-ink">
                  {provider === "google" ? "Google" : t("settings.emailProvider")}
                </span>
              </p>
            </section>

            <section className="mt-4 rounded-[24px] border border-line bg-white/55 p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("settings.security")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="min-h-9 rounded-full border border-line bg-white/70 px-3 text-[10px] font-medium text-ink"
                >
                  {t("more.signOut")}
                </button>
                {hasEmailIdentity && (
                  <button
                    type="button"
                    onClick={() => void resetPassword()}
                    className="min-h-9 rounded-full border border-line bg-white/70 px-3 text-[10px] font-medium text-ink"
                  >
                    {t("settings.resetPassword")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError("");
                    setDeleteText("");
                    setDeleteOpen(true);
                  }}
                  className="inline-flex min-h-9 items-center gap-1 rounded-full border border-clay/25 bg-clay/[0.05] px-3 text-[10px] font-medium text-clay"
                >
                  <TrashIcon className="h-3 w-3" />
                  {t("settings.deleteAccount")}
                </button>
              </div>
              {message && (
                <p role="status" className="mt-2 text-[10px] leading-4 text-muted">
                  {message}
                </p>
              )}
            </section>

            <section className="mt-4 rounded-[24px] border border-line bg-white/55 p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("settings.preferences")}
              </p>
              <div className="mt-2 flex rounded-full border border-line bg-parchment p-0.5">
                {[
                  { id: "en" as const, label: t("more.english") },
                  { id: "es" as const, label: t("more.spanish") },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    lang={option.id}
                    onClick={() => setLocale(option.id)}
                    aria-pressed={locale === option.id}
                    className={[
                      "min-h-9 flex-1 rounded-full px-3 text-[10px] font-medium transition-colors",
                      locale === option.id
                        ? "bg-olive text-cream"
                        : "text-muted",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        <section className="mt-4 rounded-[24px] border border-line bg-white/55 p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            {t("settings.legal")}
          </p>
          <div className="mt-2 space-y-2 text-[10.5px] leading-4">
            {privacyUrl ? (
              <a
                href={privacyUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-olive underline decoration-olive/30 underline-offset-2"
              >
                {t("settings.privacy")}
              </a>
            ) : (
              <p className="text-muted">
                {t("settings.privacy")}: {t("settings.notPublished")}
              </p>
            )}
            {termsUrl ? (
              <a
                href={termsUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-olive underline decoration-olive/30 underline-offset-2"
              >
                {t("settings.terms")}
              </a>
            ) : (
              <p className="text-muted">
                {t("settings.terms")}: {t("settings.notPublished")}
              </p>
            )}
            {supportEmail ? (
              <a
                href={`mailto:${supportEmail}`}
                className="block text-olive underline decoration-olive/30 underline-offset-2"
              >
                {t("settings.support")}
              </a>
            ) : (
              <p className="text-muted">
                {t("settings.support")}: {t("settings.notPublished")}
              </p>
            )}
          </div>
          {(!privacyUrl || !termsUrl || !supportEmail) && (
            <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-[9.5px] leading-4 text-[#6b5535]">
              {t("settings.launchBlocker")}
            </p>
          )}
        </section>
      </div>

      <Sheet
        open={deleteOpen}
        title={t("settings.deleteTitle")}
        onClose={() => setDeleteOpen(false)}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="min-h-11 flex-1 rounded-full border border-line bg-white/70 text-[11px] font-medium text-ink"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              disabled={deleteText !== "DELETE" || deleteBusy}
              className="min-h-11 flex-1 rounded-full bg-clay text-[11px] font-medium text-cream disabled:opacity-40"
            >
              {t("settings.deleteConfirm")}
            </button>
          </div>
        }
      >
        <p className="text-[12px] leading-5 text-muted">
          {t("settings.deleteBody")}
        </p>
        <label className="mt-4 block">
          <span className="text-[10px] text-muted">
            {t("settings.deletePrompt")}
          </span>
          <input
            value={deleteText}
            onChange={(event) => setDeleteText(event.target.value)}
            className={`${fieldClass} mt-1.5`}
            autoComplete="off"
          />
        </label>
        {deleteError && (
          <p role="alert" className="mt-2 text-[10px] leading-4 text-clay">
            {deleteError}
          </p>
        )}
      </Sheet>
    </div>
  );
}
