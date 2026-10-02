import Link from "next/link";
import { Archive, LogOut, Package, Plus } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";

export function AppHeader({ current }: { current?: "home" | "archive" | "new" }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-xl bg-sage text-paper-2">
            <Package className="size-4" aria-hidden />
          </span>
          <span>Packy</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/archive"
            className={`rounded-full px-3 py-1.5 text-sm ${current === "archive" ? "bg-paper-2 font-medium shadow-sm" : "text-ink-muted"}`}
          >
            <span className="inline-flex items-center gap-1">
              <Archive className="size-3.5" aria-hidden />
              ארכיון
            </span>
          </Link>
          <Link
            href="/shipments/new"
            className={`rounded-full px-3 py-1.5 text-sm ${current === "new" ? "bg-paper-2 font-medium shadow-sm" : "text-ink-muted"}`}
          >
            <span className="inline-flex items-center gap-1">
              <Plus className="size-3.5" aria-hidden />
              הוספה
            </span>
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full p-2 text-ink-muted hover:bg-paper-2"
              aria-label="התנתק"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
