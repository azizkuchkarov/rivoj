import Link from "next/link";

import { Users } from "lucide-react";

import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { StudentCard } from "@/components/students/StudentCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  let students;
  try {
    students = await prisma.student.findMany({
      orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
      include: {
        primaryTeacher: { select: { id: true, fullName: true } },
      },
    });
  } catch {
    return <DbUnavailable />;
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-800 ring-1 ring-violet-100">
            <Users className="h-3.5 w-3.5" aria-hidden />
            Bolalar
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
            O‘quvchilar
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
            Markazga qabul qilingan bolalar: vasiy aloqa ma’lumotlari va asosiy o‘qituvchi biriktirish.
          </p>
        </div>
        <Link
          href="/students/new"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/25 transition hover:brightness-[1.03]"
        >
          + Yangi o‘quvchi
        </Link>
      </header>

      {students.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-violet-200/90 bg-white/50 px-8 py-16 text-center">
          <p className="font-display text-lg font-medium text-[var(--ink)]">Hozircha o‘quvchilar yo‘q</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Birinchi kartochkani qo‘shib boshlang.</p>
          <Link
            href="/students/new"
            className="mt-6 inline-flex rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-violet-700"
          >
            O‘quvchi qo‘shish
          </Link>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {students.map((s) => (
            <li key={s.id}>
              <StudentCard student={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
