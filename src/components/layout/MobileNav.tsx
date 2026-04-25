"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { navForRole, type AppRole } from "./nav-items";

export function MobileNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navForRole(role);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="icon-sm" className="lg:hidden" aria-label="Menyu">
            <Menu className="size-4" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle className="text-base">Rivoj</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-0.5 p-2">
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
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
