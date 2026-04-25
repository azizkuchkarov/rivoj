"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { navForRole, type AppRole } from "./nav-items";

export function AppSidebar({ className, role }: { className?: string; role: AppRole }) {
  const pathname = usePathname();
  const items = navForRole(role);

  return (
    <aside
      className={cn(
        "flex w-60 shrink-0 flex-col border-r border-border bg-card",
        className,
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold tracking-tight">Rivoj</p>
          <p className="truncate text-[11px] text-muted-foreground">Logopedik markaz</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({
                  variant: active ? "secondary" : "ghost",
                  size: "default",
                  className:
                    "h-9 w-full justify-start gap-2 px-3 font-medium [&_svg]:size-4",
                }),
                active && "bg-primary text-primary-foreground hover:bg-primary",
              )}
            >
              <Icon className="shrink-0 opacity-80" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
