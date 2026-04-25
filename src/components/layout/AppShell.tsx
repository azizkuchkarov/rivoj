import type { ReactNode } from "react";
import { headers } from "next/headers";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getCurrentRole } from "@/lib/auth";

export async function AppShell({ children }: { children: ReactNode }) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  if (pathname === "/login") {
    return <>{children}</>;
  }

  const role = (await getCurrentRole()) ?? "manager";
  return (
    <div className="flex min-h-full flex-1">
      <AppSidebar className="hidden lg:flex" role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <SiteHeader />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
