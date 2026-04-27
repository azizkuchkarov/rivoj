import Link from "next/link";

import { Calendar, Pencil, Phone, Sparkles } from "lucide-react";

import { deleteTeacher } from "@/app/teachers/actions";
import { DeleteConfirmForm } from "@/components/common/DeleteConfirmForm";
import { Avatar } from "@/components/teachers/Avatar";
import {
  TeacherLessonEarningsSection,
  type TeacherLessonEarningRow,
} from "@/components/teachers/TeacherLessonEarningsSection";
import { TeacherTelegramTestButton } from "@/components/teachers/TeacherTelegramTestButton";
import type { Teacher } from "@/generated/prisma/client";

type TeacherProfileProps = {
  teacher: Teacher;
  lessonEarningRows: TeacherLessonEarningRow[];
};

export function TeacherProfile({
  teacher,
  lessonEarningRows,
}: TeacherProfileProps) {
  const created = new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(teacher.createdAt);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-white p-8 md:p-10">

        <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <Avatar name={teacher.fullName} photoUrl={teacher.photoUrl} size="xl" />
            <div className="min-w-0 space-y-2 pb-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold tabular-nums text-slate-800 ring-1 ring-slate-200">
                  № {teacher.listNumber}
                </span>
                {teacher.isActive ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-900 ring-1 ring-emerald-300">
                    Faol
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-zinc-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700">
                    Nofaol
                  </span>
                )}
                {typeof teacher.experienceYears === "number" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-amber-100">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    {teacher.experienceYears} yil tajriba
                  </span>
                ) : null}
                {teacher.offersConsultation ? (
                  <span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-900 ring-1 ring-violet-300">
                    Konsultatsiya
                  </span>
                ) : null}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
                {teacher.fullName}
              </h1>
              {teacher.title ? (
                <p className="text-lg text-black">{teacher.title}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <Link
              href={`/teachers/${teacher.id}/edit`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-indigo-200 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-900 transition hover:border-indigo-300 hover:bg-indigo-50"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Profilni tahrirlash
            </Link>
            <TeacherTelegramTestButton teacherId={teacher.id} />
            <DeleteConfirmForm
              action={deleteTeacher}
              id={teacher.id}
              displayName={teacher.fullName}
              entityLabel="O‘qituvchini"
            />
          </div>
        </div>

        {teacher.specialties.length > 0 ? (
          <ul className="relative mt-8 flex flex-wrap gap-2">
            {teacher.specialties.map((s) => (
              <li
                key={s}
                className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-indigo-950 ring-1 ring-indigo-100"
              >
                {s}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="relative mt-5 grid gap-2 text-sm text-[var(--ink-soft)] md:grid-cols-2">
          <p className="inline-flex items-center gap-2">
            <Phone className="h-4 w-4 text-teal-700" aria-hidden />
            <span className="font-medium text-[var(--ink)]">Telefon:</span> {teacher.phone ?? "—"}
          </p>
          <p className="inline-flex items-center gap-2">
            <Calendar className="h-4 w-4 text-teal-700" aria-hidden />
            <span className="font-medium text-[var(--ink)]">Ro‘yxatdan o‘tgan:</span> {created}
          </p>
        </div>
      </section>

      <TeacherLessonEarningsSection rows={lessonEarningRows} />
    </div>
  );
}
