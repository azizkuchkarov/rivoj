import Link from "next/link";

import { CalendarDays, LayoutGrid } from "lucide-react";

import { cn } from "@/lib/cn";
import { SCHEDULE_LESSON_PATH } from "@/lib/schedule-paths";

type ScheduleViewSwitcherProps = {
  active: "week" | "day";
  weekMondayIso: string;
  dayIso: string;
  /** Masalan `/schedule` yoki `/konsultatsiya` */
  basePath?: string;
};

export function ScheduleViewSwitcher({
  active,
  weekMondayIso,
  dayIso,
  basePath = SCHEDULE_LESSON_PATH,
}: ScheduleViewSwitcherProps) {
  const weekHref = `${basePath}?view=week&week=${weekMondayIso}`;
  const dayHref = `${basePath}?view=day&date=${dayIso}`;

  return (
    <div className="inline-flex shrink-0 rounded-full border border-zinc-200/90 bg-white/80 p-1 shadow-inner shadow-black/5">
      <Link
        href={weekHref}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
          active === "week"
            ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] text-white shadow-sm"
            : "text-[var(--ink-soft)] hover:bg-zinc-50",
        )}
      >
        <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
        Hafta
      </Link>
      <Link
        href={dayHref}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
          active === "day"
            ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] text-white shadow-sm"
            : "text-[var(--ink-soft)] hover:bg-zinc-50",
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
        Kun
      </Link>
    </div>
  );
}
