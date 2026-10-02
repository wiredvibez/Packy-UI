import { Suspense } from "react";
import { Package } from "lucide-react";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-5 py-12">
      <div className="rounded-3xl border border-line bg-paper-2 p-6 shadow-[0_20px_50px_-32px_rgba(29,26,22,0.5)]">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-sage text-paper-2">
            <Package className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm text-ink-muted">פרטי</p>
            <h1 className="text-2xl font-semibold">Packy</h1>
          </div>
        </div>
        <p className="mb-5 text-sm leading-6 text-ink-muted">
          דשבורד המשלוחים של יאיר. הכנס את קוד הכניסה כדי לראות מה בדרך.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
