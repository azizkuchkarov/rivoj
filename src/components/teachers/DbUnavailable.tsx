import Link from "next/link";

export function DbUnavailable() {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-amber-200/80 bg-amber-50/90 p-8 text-center shadow-lg shadow-amber-900/5">
      <h1 className="font-display text-xl font-semibold tracking-tight text-amber-950">
        Ma’lumotlar bazasiga ulanib bo‘lmadi
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-amber-950/80">
        PostgreSQL ishga tushirilganligini va <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">DATABASE_URL</code>{" "}
        to‘g‘riligini tekshiring. Keyin sahifani yangilang.
      </p>
      <Link
        href="/teachers"
        className="mt-6 inline-flex rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-amber-700"
      >
        Qayta urinish
      </Link>
    </div>
  );
}
