import Link from "next/link";

import { Sparkles } from "lucide-react";

import { logoutAction } from "@/app/login/actions";
import { AttendanceNotifications } from "@/components/layout/AttendanceNotifications";
import { MobileNav } from "@/components/layout/MobileNav";
import { Separator } from "@/components/ui/separator";
import { getCurrentRole } from "@/lib/auth";

export async function SiteHeader() {
  const role = await getCurrentRole();
  const safeRole = role ?? "manager";
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6">
      <MobileNav role={safeRole} />
      <Separator orientation="vertical" className="h-6 lg:hidden" />
      <Link href="/" className="flex min-w-0 items-center gap-2 lg:hidden">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <span className="truncate text-sm font-semibold">Rivoj</span>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        {role ? (
          <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700">
            {role === "manager" ? "Manager" : "Admin"}
          </span>
        ) : null}
        <AttendanceNotifications />
        {role ? (
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Chiqish
            </button>
          </form>
        ) : null}
      </div>
    </header>
  );
}
