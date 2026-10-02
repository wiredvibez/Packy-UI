"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNextPath } from "@/lib/auth/paths";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (response.status === 429) {
        setError("יותר מדי ניסיונות. נסה שוב בעוד רבע שעה.");
        return;
      }
      if (response.status >= 500) {
        setError("השרת לא מוגדר. בדקו את משתני הסביבה.");
        return;
      }
      if (!response.ok) {
        setError("הקוד לא נכון.");
        return;
      }
      const next = safeNextPath(searchParams.get("next"));
      router.replace(next as Route);
      router.refresh();
    } catch {
      setError("משהו השתבש. נסה שוב.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">קוד כניסה</span>
        <input
          type="password"
          name="passcode"
          autoComplete="current-password"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          className="field"
          required
        />
      </label>
      {error ? <p className="text-sm text-rose">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-sage px-4 py-3 font-semibold text-paper-2 disabled:opacity-60"
      >
        {pending ? "בודק…" : "כניסה"}
      </button>
    </form>
  );
}
