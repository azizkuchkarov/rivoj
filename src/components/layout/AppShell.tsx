import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/SiteHeader";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.35),transparent_65%)] blur-2xl" />
        <div className="absolute -right-20 top-40 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.22),transparent_68%)] blur-2xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12),transparent_70%)] blur-2xl" />
      </div>
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </div>
    </div>
  );
}
