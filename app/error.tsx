"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center px-5 text-center">
      <h1 className="text-2xl font-semibold">משהו השתבש</h1>
      <p className="mt-2 text-sm leading-6 text-ink-muted">
        לא הצלחנו לטעון את הנתונים. אם זו הפעלה ראשונה, ודאו ש-Neon מחובר
        ושהמיגרציה רצה.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-5 rounded-full bg-sage px-4 py-2 text-sm font-semibold text-paper-2"
      >
        נסו שוב
      </button>
    </main>
  );
}
