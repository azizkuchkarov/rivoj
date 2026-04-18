import Link from "next/link";

import { Sparkles } from "lucide-react";

const nav = [
  { href: "/schedule", label: "Dars jadvali" },
  { href: "/konsultatsiya", label: "Konsultatsiya jadvali" },
  { href: "/teachers", label: "O‘qituvchilar" },
  { href: "/students", label: "O‘quvchilar" },
  { href: "/payments", label: "To‘lovlar" },
  { href: "/expenses", label: "Xarajat" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-[color:var(--surface-glass)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] text-white shadow-lg shadow-teal-900/15 ring-2 ring-white/70 transition group-hover:scale-[1.02]">
            <Sparkles className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-[var(--ink)]">Rivoj</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
              Logopedik markaz
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-[var(--ink-soft)] transition hover:bg-white/70 hover:text-[var(--ink)] sm:px-4"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
