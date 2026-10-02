import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center px-5 text-center">
      <h1 className="text-2xl font-semibold">לא נמצא</h1>
      <p className="mt-2 text-sm text-ink-muted">העמוד או המשלוח הזה לא קיימים.</p>
      <Link
        href="/"
        className="mt-5 rounded-full bg-sage px-4 py-2 text-sm font-semibold text-paper-2"
      >
        חזרה הביתה
      </Link>
    </main>
  );
}
