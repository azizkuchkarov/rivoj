import Link from "next/link";

import {
  CalendarDays,
  GraduationCap,
  Sparkles,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

import { TeacherCard } from "@/components/teachers/TeacherCard";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { cn } from "@/lib/cn";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ holat?: string }>;
};

function HolatFilter({ current }: { current: "all" | "faol" | "nofaol" }) {
  const pill =
    "inline-flex shrink-0 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ring-1";
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/teachers"
        className={cn(
          pill,
          current === "all"
            ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] text-white shadow-md ring-transparent"
            : "bg-white/90 text-[var(--ink-soft)] ring-zinc-200 hover:bg-teal-50/90",
        )}
      >
        Barchasi
      </Link>
      <Link
        href="/teachers?holat=faol"
        className={cn(
          pill,
          current === "faol"
            ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] text-white shadow-md ring-transparent"
            : "bg-white/90 text-[var(--ink-soft)] ring-zinc-200 hover:bg-teal-50/90",
        )}
      >
        Faol
      </Link>
      <Link
        href="/teachers?holat=nofaol"
        className={cn(
          pill,
          current === "nofaol"
            ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] text-white shadow-md ring-transparent"
            : "bg-white/90 text-[var(--ink-soft)] ring-zinc-200 hover:bg-teal-50/90",
        )}
      >
        Nofaol
      </Link>
    </div>
  );
}

export default async function TeachersPage({ searchParams }: PageProps) {
  const holatParam = (await searchParams).holat;
  const holatFilter: "all" | "faol" | "nofaol" =
    holatParam === "faol" ? "faol" : holatParam === "nofaol" ? "nofaol" : "all";

  const where =
    holatFilter === "faol"
      ? { isActive: true }
      : holatFilter === "nofaol"
        ? { isActive: false }
        : {};

  let teachers;
  let totalTeachers = 0;
  let activeTeachers = 0;
  let inactiveTeachers = 0;
  let studentsWithPrimary = 0;

  try {
    const [list, cTotal, cActive, cInactive, cLinked] = await Promise.all([
      prisma.teacher.findMany({
        where,
        orderBy: [{ isActive: "desc" }, { listNumber: "asc" }, { fullName: "asc" }],
        include: {
          _count: {
            select: { students: true, lessons: true },
          },
        },
      }),
      prisma.teacher.count(),
      prisma.teacher.count({ where: { isActive: true } }),
      prisma.teacher.count({ where: { isActive: false } }),
      prisma.student.count({ where: { primaryTeacherId: { not: null } } }),
    ]);
    teachers = list;
    totalTeachers = cTotal;
    activeTeachers = cActive;
    inactiveTeachers = cInactive;
    studentsWithPrimary = cLinked;
  } catch {
    return <DbUnavailable />;
  }

  const emptyByFilter = teachers.length === 0 && totalTeachers > 0;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-800 ring-1 ring-teal-100">
            <Users className="h-3.5 w-3.5" aria-hidden />
            Jamoa
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
            O‘qituvchilar
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
            Har bir mutaxassisning profili — tartib raqami, mutaxassisliklari va tajribasi bir joyda. Pastdagi
            kartochkalarda asosiy o‘quvchilar va jadvaldagi darslar soni ko‘rinadi; filtr orqali faqat faol yoki
            nofaol jamoani ajratib ko‘rishingiz mumkin.
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end">
          <Link
            href="/schedule"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white/95 px-5 py-3 text-sm font-semibold text-[var(--ink-soft)] shadow-sm ring-1 ring-black/5 transition hover:bg-teal-50/80"
          >
            <CalendarDays className="h-4 w-4 text-teal-700" aria-hidden />
            Dars jadvali
          </Link>
          <Link
            href="/teachers/new"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 transition hover:brightness-[1.03]"
          >
            + Yangi o‘qituvchi
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/70 bg-[color:var(--surface)] p-4 shadow-inner shadow-black/5 ring-1 ring-teal-100/80">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-800">
            <Users className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
            Jami o‘qituvchilar
          </div>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-[var(--ink)]">
            {totalTeachers}
          </p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-[color:var(--surface)] p-4 shadow-inner shadow-black/5 ring-1 ring-emerald-100/90">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">
            <UserCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            Faol
          </div>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-[var(--ink)]">
            {activeTeachers}
          </p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-[color:var(--surface)] p-4 shadow-inner shadow-black/5 ring-1 ring-zinc-200/90">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-600">
            <UserX className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
            Nofaol
          </div>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-[var(--ink)]">
            {inactiveTeachers}
          </p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-[color:var(--surface)] p-4 shadow-inner shadow-black/5 ring-1 ring-violet-100/90 sm:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-800">
            <GraduationCap className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
            Asosiy o‘qituvchisi bor
          </div>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-[var(--ink)]">
            {studentsWithPrimary}{" "}
            <span className="text-base font-medium text-[var(--muted)]">o‘quvchi</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-[color:var(--surface)] p-4 shadow-inner shadow-black/5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Ro‘yxat filtri</p>
          <HolatFilter current={holatFilter} />
        </div>
        <p className="text-sm text-[var(--muted)]">
          {holatFilter === "all"
            ? `Ko‘rsatilmoqda: ${teachers.length} ta`
            : `Tanlangan filtr: ${holatFilter === "faol" ? "faqat faol" : "faqat nofaol"} · ${teachers.length} ta`}
        </p>
      </div>

      {emptyByFilter ? (
        <div className="rounded-3xl border border-dashed border-teal-200/90 bg-white/50 px-8 py-14 text-center">
          <p className="font-display text-lg font-medium text-[var(--ink)]">Bu filtr bo‘yicha natija yo‘q</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Boshqa holatni tanlang yoki ro‘yxatni to‘liq oching.
          </p>
          <Link
            href="/teachers"
            className="mt-6 inline-flex rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-teal-700"
          >
            Barcha o‘qituvchilar
          </Link>
        </div>
      ) : teachers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-teal-200/80 bg-gradient-to-br from-white/80 via-teal-50/30 to-white/50 px-8 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100/90 text-teal-800 ring-1 ring-teal-200/80">
            <Sparkles className="h-7 w-7" aria-hidden />
          </div>
          <p className="mt-6 font-display text-lg font-medium text-[var(--ink)]">Hozircha o‘qituvchilar yo‘q</p>
          <p className="mt-2 max-w-md mx-auto text-sm text-[var(--muted)]">
            Birinchi profilni yarating — keyin bolalarni asosiy o‘qituvchi sifatida biriktirish va jadvaldagi
            darslarni bog‘lash osonlashadi.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/teachers/new"
              className="inline-flex rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-[1.03]"
            >
              Profil qo‘shish
            </Link>
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink-soft)] shadow-sm hover:bg-zinc-50"
            >
              <CalendarDays className="h-4 w-4" aria-hidden />
              Jadvalni ko‘rish
            </Link>
          </div>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {teachers.map((t) => (
            <li key={t.id}>
              <TeacherCard teacher={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
