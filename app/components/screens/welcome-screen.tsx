"use client";

import { useState } from "react";
import { useAppData } from "../../lib/app-data";
import { useI18n } from "../../lib/i18n";

const fieldClass =
  "w-full rounded-xl border border-line bg-white/75 px-3 py-2.5 text-[12px] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-olive/35 focus:ring-2 focus:ring-olive/15";

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.59A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.92A6.01 6.01 0 0 1 6.1 12c0-.67.11-1.32.31-1.92V7.49H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.51l3.35-2.59Z" />
      <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.35 2.59C7.2 7.72 9.4 5.96 12 5.96Z" />
    </svg>
  );
}

export function WelcomeScreen() {
  const { signIn, signUp, signInWithGoogle, resendConfirmation } = useAppData();
  const { t } = useI18n();
  const [emailOpen, setEmailOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  async function submit() {
    if (busy) return;
    if (!email.trim() || !password) {
      setMessage(t("welcome.fieldsRequired"));
      return;
    }
    setBusy(true);
    setMessage("");
    const result =
      mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password);
    setBusy(false);
    if (!result.ok) {
      const error = result.error ?? "";
      if (/email not confirmed/i.test(error)) {
        setPendingEmail(email.trim());
      } else {
        setMessage(
          /already registered/i.test(error)
            ? t("more.accountExists")
            : error || t("more.accountError"),
        );
      }
      return;
    }
    if (result.confirmationRequired) {
      setPendingEmail(email.trim());
      return;
    }
    setPassword("");
  }

  async function resend() {
    if (!pendingEmail || busy) return;
    setBusy(true);
    const result = await resendConfirmation(pendingEmail);
    setBusy(false);
    setMessage(
      result.ok ? t("more.confirmationResent") : result.error ?? t("welcome.error"),
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-cream px-6 py-10 sm:my-7 sm:min-h-[calc(100dvh-3.5rem)] sm:rounded-[40px] sm:border sm:border-line sm:shadow-[0_40px_90px_-35px_rgba(53,48,38,0.45)]">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-olive text-cream">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6" aria-hidden="true">
            <path d="M3.5 10.4 12 3.5l8.5 6.9" />
            <path d="M5.5 9.2V20a.8.8 0 0 0 .8.8h4.1v-6.2h3.2v6.2h4.1a.8.8 0 0 0 .8-.8V9.2" />
          </svg>
        </div>

        <p className="mt-7 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
          {t("welcome.eyebrow")}
        </p>
        <h1 className="mt-2 text-center font-serif text-[36px] leading-[1.05] tracking-[-0.02em] text-ink">
          The Next Home Edit
        </h1>
        <p className="mt-3 text-center text-[12px] leading-5 text-muted">
          {t("welcome.tagline")}
        </p>

        {pendingEmail ? (
          <div className="mt-8 rounded-[22px] border border-gold/30 bg-gold/10 px-4 py-4">
            <p className="text-[12px] font-medium text-[#6b5535]">
              {t("more.confirmTitle")}
            </p>
            <p className="mt-1 text-[10px] leading-4 text-[#6b5535]">
              {t("more.confirmBody", { email: pendingEmail })}
            </p>
            <button
              type="button"
              onClick={() => void resend()}
              disabled={busy}
              className="mt-3 min-h-9 rounded-full border border-olive/25 bg-white/70 px-3 text-[10px] font-medium text-olive disabled:opacity-50"
            >
              {t("more.resendConfirmation")}
            </button>
            {message && (
              <p role="status" className="mt-2 text-[10px] leading-4 text-[#6b5535]">
                {message}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-8">
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-line bg-white/80 px-4 text-[12px] font-medium text-ink"
            >
              <GoogleMark />
              {t("welcome.continueGoogle")}
            </button>

            <div className="my-4 flex items-center gap-2" aria-hidden="true">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[9px] uppercase tracking-[0.12em] text-muted">
                {t("more.or")}
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>

            {!emailOpen ? (
              <button
                type="button"
                onClick={() => setEmailOpen(true)}
                className="min-h-11 w-full rounded-full border border-line bg-white/60 px-4 text-[12px] font-medium text-ink"
              >
                {t("welcome.continueEmail")}
              </button>
            ) : (
              <div className="rounded-[22px] border border-line bg-white/55 p-4">
                <div className="flex rounded-full border border-line bg-parchment p-0.5">
                  {(["signin", "signup"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setMode(value);
                        setMessage("");
                      }}
                      aria-pressed={mode === value}
                      className={[
                        "min-h-8 flex-1 rounded-full text-[10px] font-medium transition-colors",
                        mode === value ? "bg-olive text-cream" : "text-muted",
                      ].join(" ")}
                    >
                      {value === "signin" ? t("welcome.signIn") : t("welcome.createAccount")}
                    </button>
                  ))}
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("more.email")}
                  className={`${fieldClass} mt-3`}
                />
                <input
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t("more.password")}
                  className={`${fieldClass} mt-2`}
                />
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={busy}
                  className="mt-3 min-h-10 w-full rounded-full bg-olive text-[11px] font-medium text-cream disabled:opacity-50"
                >
                  {mode === "signin" ? t("welcome.signIn") : t("welcome.createAccount")}
                </button>
                {message && (
                  <p role="status" className="mt-2 text-[10px] leading-4 text-muted">
                    {message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-[9px] leading-4 text-muted">
        {t("welcome.privacyNote")}
      </p>
    </main>
  );
}
