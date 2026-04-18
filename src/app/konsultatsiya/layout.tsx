import type { ReactNode } from "react";
import Link from "next/link";

import { SCHEDULE_CONSULTATION_PATH } from "@/lib/schedule-paths";

export default function KonsultatsiyaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-8">
      <nav className="flex flex-wrap gap-2 border-b border-zinc-200/80 pb-4 text-sm font-medium">
        <Link
          href={SCHEDULE_CONSULTATION_PATH}
          className="rounded-full px-4 py-2 text-[var(--ink-soft)] ring-1 ring-zinc-200/90 transition hover:bg-white/80"
        >
          Jadval
        </Link>
        <Link
          href="/konsultatsiya/qabul"
          className="rounded-full px-4 py-2 text-[var(--ink-soft)] ring-1 ring-zinc-200/90 transition hover:bg-white/80"
        >
          Ro‘yxatga olish
        </Link>
      </nav>
      {children}
    </div>
  );
}
