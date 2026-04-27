import { ShieldUser, UserCog } from "lucide-react";

import { SystemProfileCard } from "@/components/profiles/SystemProfileCard";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { SystemProfileRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProfilesPage() {
  let manager: { fullName: string; telegramChatId: string | null; isActive: boolean } | undefined;
  let admin: { fullName: string; telegramChatId: string | null; isActive: boolean } | undefined;
  try {
    const rows = await prisma.systemProfile.findMany({
      where: { role: { in: [SystemProfileRole.MANAGER, SystemProfileRole.ADMIN] } },
      select: { role: true, fullName: true, telegramChatId: true, isActive: true },
    });
    const m = rows.find((x) => x.role === SystemProfileRole.MANAGER);
    const a = rows.find((x) => x.role === SystemProfileRole.ADMIN);
    manager = m
      ? { fullName: m.fullName, telegramChatId: m.telegramChatId, isActive: m.isActive }
      : { fullName: "Markaz rahbari", telegramChatId: null, isActive: true };
    admin = a
      ? { fullName: a.fullName, telegramChatId: a.telegramChatId, isActive: a.isActive }
      : { fullName: "Admin", telegramChatId: null, isActive: true };
  } catch {
    return <DbUnavailable />;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-border bg-[color:var(--surface)] p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-[var(--ink)] md:text-3xl">Profillar</h1>
        <p className="mt-1 text-sm text-black">
          Rahbar va admin uchun Telegram profillarini sozlang. 18:00 va 19:00 xabarlar shu yerda berilgan ID’ga yuboriladi.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-900">
            <ShieldUser className="h-4 w-4" aria-hidden /> Markaz rahbari
          </p>
          <SystemProfileCard
            role={SystemProfileRole.MANAGER}
            title="Markaz rahbari profili"
            description="18:00 — bugungi dars/qarzdorlik hisoboti, 19:00 — ertangi umumiy jadval."
            defaultValues={manager}
          />
        </div>
        <div className="space-y-3">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-900">
            <UserCog className="h-4 w-4" aria-hidden /> Admin
          </p>
          <SystemProfileCard
            role={SystemProfileRole.ADMIN}
            title="Admin profili"
            description="19:00 — umumiy darslar soni, qarzdorlik soni va ertangi umumiy jadval."
            defaultValues={admin}
          />
        </div>
      </section>
    </div>
  );
}
