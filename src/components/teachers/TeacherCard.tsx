import Link from "next/link";

import { ArrowUpRight, BookOpen, Briefcase, Phone, Users } from "lucide-react";

import { Avatar } from "@/components/teachers/Avatar";
import type { Teacher } from "@/generated/prisma/client";

type TeacherCardProps = {
  teacher: Pick<
    Teacher,
    | "id"
    | "listNumber"
    | "fullName"
    | "title"
    | "phone"
    | "photoUrl"
    | "specialties"
    | "experienceYears"
    | "isActive"
    | "offersConsultation"
  > & {
    _count: { students: number; lessons: number };
  };
};

export function TeacherCard({ teacher }: TeacherCardProps) {
  const topSpecs = teacher.specialties.slice(0, 3);
  const more = teacher.specialties.length - topSpecs.length;

  return (
    <Link
      href={`/teachers/${teacher.id}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-[color:var(--surface)] p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-transparent to-indigo-50 opacity-0 transition group-hover:opacity-100" />
      <div className="relative flex items-start gap-4">
        <Avatar name={teacher.fullName} photoUrl={teacher.photoUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-lg bg-indigo-100 px-2 text-xs font-bold tabular-nums text-indigo-900 ring-1 ring-indigo-200">
                  №{teacher.listNumber}
                </span>
                <h2 className="truncate text-lg font-semibold tracking-tight text-[var(--ink)]">
                  {teacher.fullName}
                </h2>
                {teacher.offersConsultation ? (
                  <span className="shrink-0 rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-900 ring-1 ring-violet-200">
                    Konsultatsiya
                  </span>
                ) : null}
              </div>
              {teacher.title ? (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-black">
                  <Briefcase className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="truncate">{teacher.title}</span>
                </p>
              ) : null}
            </div>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-700 shadow-sm ring-1 ring-border transition group-hover:bg-indigo-50">
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {teacher.isActive ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-100">
                Faol
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 ring-1 ring-zinc-200">
                Nofaol
              </span>
            )}
            {typeof teacher.experienceYears === "number" ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-900 ring-1 ring-amber-100">
                {teacher.experienceYears} yil tajriba
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-950 ring-1 ring-indigo-100"
              title="Asosiy o‘qituvchi sifatida biriktirilgan o‘quvchilar"
            >
              <Users className="h-3.5 w-3.5 shrink-0 text-indigo-600" aria-hidden />
              <span className="tabular-nums">{teacher._count.students}</span>
              <span className="font-medium text-indigo-900">asosiy</span>
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-950 ring-1 ring-indigo-100"
              title="Jadvaldagi barcha dars yozuvlari"
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0 text-indigo-600" aria-hidden />
              <span className="tabular-nums">{teacher._count.lessons}</span>
              <span className="font-medium text-indigo-900">dars</span>
            </span>
          </div>
        </div>
      </div>
      {topSpecs.length > 0 ? (
        <ul className="relative mt-5 flex flex-wrap gap-2">
          {topSpecs.map((s) => (
            <li
              key={s}
              className="rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-900 ring-1 ring-indigo-100"
            >
              {s}
            </li>
          ))}
          {more > 0 ? (
            <li className="rounded-full bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-100">
              +{more}
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="relative mt-5 text-sm text-black">Mutaxassisliklar hali kiritilmagan.</p>
      )}
      <div className="relative mt-6 space-y-2 border-t border-border pt-4 text-sm text-black">
        {teacher.phone ? (
          <p className="flex items-center gap-2 truncate">
            <Phone className="h-4 w-4 shrink-0 text-indigo-700" aria-hidden />
            <span className="truncate">{teacher.phone}</span>
          </p>
        ) : (
          <p className="text-xs text-zinc-400">Telefon keyinroq qo‘shiladi.</p>
        )}
      </div>
    </Link>
  );
}
