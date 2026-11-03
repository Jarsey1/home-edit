"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useI18n } from "../lib/i18n";

const fieldClass =
  "w-full rounded-xl border border-line bg-white/75 px-3 py-2.5 text-[12px] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-olive/35 focus:ring-2 focus:ring-olive/15";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const [ready, setReady] = useState(!supabase);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setReady(Boolean(data.session));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (!supabase || busy) return;
    if (password.length < 6) {
      setMessage(t("reset.tooShort"));
      return;
    }
    if (password !== confirm) {
      setMessage(t("reset.mismatch"));
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(t("reset.success"));
    setPassword("");
    setConfirm("");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-cream px-6 py-10 sm:my-7 sm:min-h-[calc(100dvh-3.5rem)] sm:rounded-[40px] sm:border sm:border-line">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
        {t("reset.eyebrow")}
      </p>
      <h1 className="mt-2 font-serif text-[30px] leading-none tracking-[-0.02em] text-ink">
        {t("reset.title")}
      </h1>

      {!ready ? (
        <p className="mt-5 text-[12px] leading-5 text-muted">
          {t("reset.openLink")}
        </p>
      ) : (
        <div className="mt-5 rounded-[24px] border border-line bg-white/55 p-4">
          <p className="text-[10.5px] leading-4 text-muted">
            {t("reset.hint")}
          </p>
          <label className="mt-3 block">
            <span className="text-[10px] text-muted">{t("reset.password")}</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${fieldClass} mt-1.5`}
            />
          </label>
          <label className="mt-2 block">
            <span className="text-[10px] text-muted">{t("reset.confirm")}</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={`${fieldClass} mt-1.5`}
            />
          </label>
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="mt-3 min-h-10 rounded-full bg-olive px-4 text-[11px] font-medium text-cream disabled:opacity-50"
          >
            {t("reset.save")}
          </button>
          {message && (
            <p role="status" className="mt-2 text-[10px] leading-4 text-muted">
              {message}
            </p>
          )}
        </div>
      )}

      <Link
        href="/"
        className="mt-5 text-center text-[10px] text-olive underline decoration-olive/30 underline-offset-2"
      >
        {t("reset.back")}
      </Link>
    </main>
  );
}
