import Link from "next/link";

import { ArrowUpRight, Baby, GraduationCap, Phone, User } from "lucide-react";

import { Avatar } from "@/components/teachers/Avatar";
import type { Student, Teacher } from "@/generated/prisma/client";
import { ageFromDateOfBirth } from "@/lib/age";
import { formatStudentGender } from "@/lib/student-gender";
import { cn } from "@/lib/cn";

type StudentCardProps = {
  student: Student & { primaryTeacher: Pick<Teacher, "id" | "fullName"> | null };
};

export function StudentCard({ student }: StudentCardProps) {
  const topFocus = student.focusAreas.slice(0, 3);
  const more = student.focusAreas.length - topFocus.length;
  const age =
    student.dateOfBirth != null ? ageFromDateOfBirth(student.dateOfBirth) : null;
  const genderLabel = formatStudentGender(student.gender);

  return (
    <Link
      href={`/students/${student.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-white/60 bg-[color:var(--surface)] p-6 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.35)] transition duration-300",
        "hover:-translate-y-0.5 hover:border-violet-200/90 hover:shadow-[0_28px_70px_-30px_rgba(109,40,217,0.35)]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-violet-50/50 opacity-0 transition group-hover:opacity-100" />
      <div className="relative flex items-start gap-4">
        <Avatar name={student.fullName} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight text-[var(--ink)]">
                {student.fullName}
              </h2>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--muted)]">
                <span className="inline-flex items-center gap-1">
                  <Baby className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                  {age !== null ? (
                    <span>{age} yosh</span>
                  ) : genderLabel ? (
                    <span>{genderLabel}</span>
                  ) : (
                    <span>Yosh kiritilmagan</span>
                  )}
                </span>
              </p>
            </div>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-violet-700 shadow-sm ring-1 ring-black/5 transition group-hover:bg-violet-50">
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {student.isActive ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-100">
                Faol
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 ring-1 ring-zinc-200/80">
                Nofaol
              </span>
            )}
            {student.primaryTeacher ? (
              <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-violet-50/90 px-2.5 py-0.5 text-[11px] font-medium text-violet-900 ring-1 ring-violet-100">
                <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{student.primaryTeacher.fullName}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
      {topFocus.length > 0 ? (
        <ul className="relative mt-5 flex flex-wrap gap-2">
          {topFocus.map((s) => (
            <li
              key={s}
              className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-violet-950/90 ring-1 ring-violet-100"
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
        <p className="relative mt-5 text-sm text-[var(--muted)]">Yo‘nalishlar keyinroq kiritiladi.</p>
      )}
      <div className="relative mt-6 space-y-2 border-t border-white/60 pt-4 text-sm text-[var(--muted)]">
        {student.guardianName ? (
          <p className="flex items-center gap-2 truncate">
            <User className="h-4 w-4 shrink-0 text-violet-700/80" aria-hidden />
            <span className="truncate">{student.guardianName}</span>
          </p>
        ) : null}
        {student.guardianPhone ? (
          <p className="flex items-center gap-2 truncate">
            <Phone className="h-4 w-4 shrink-0 text-violet-700/80" aria-hidden />
            <span className="truncate">{student.guardianPhone}</span>
          </p>
        ) : null}
        {!student.guardianName && !student.guardianPhone ? (
          <p className="text-xs text-zinc-400">Vasiy aloqa ma’lumotlari kiritilmagan.</p>
        ) : null}
      </div>
    </Link>
  );
}
