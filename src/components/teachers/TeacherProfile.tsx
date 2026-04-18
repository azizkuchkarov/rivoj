import Link from "next/link";

import { Calendar, Pencil, Phone, Sparkles } from "lucide-react";

import { deleteTeacher } from "@/app/teachers/actions";
import { DeleteConfirmForm } from "@/components/common/DeleteConfirmForm";
import { Avatar } from "@/components/teachers/Avatar";
import { TeacherPaymentsSection } from "@/components/teachers/TeacherPaymentsSection";
import type { Payment, Student, Teacher } from "@/generated/prisma/client";

type PaymentForTeacher = Payment & {
  student: Pick<Student, "id" | "fullName">;
};

type TeacherProfileProps = {
  teacher: Teacher;
  teacherPayments: PaymentForTeacher[];
  totalTeacherShareSom: number;
  /** Darsda belgilangan keldi/to‘lov bo‘yicha tushum */
  lessonEarningsSom?: number;
};

export function TeacherProfile({
  teacher,
  teacherPayments,
  totalTeacherShareSom,
  lessonEarningsSom = 0,
}: TeacherProfileProps) {
  const created = new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(teacher.createdAt);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-white via-teal-50/40 to-amber-50/30 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] md:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <Avatar name={teacher.fullName} photoUrl={teacher.photoUrl} size="xl" />
            <div className="min-w-0 space-y-2 pb-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold tabular-nums text-slate-800 ring-1 ring-slate-200">
                  № {teacher.listNumber}
                </span>
                {teacher.isActive ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-900 ring-1 ring-emerald-400/30">
                    Faol
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-zinc-200/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700">
                    Nofaol
                  </span>
                )}
                {typeof teacher.experienceYears === "number" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-amber-100">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    {teacher.experienceYears} yil tajriba
                  </span>
                ) : null}
                {teacher.offersConsultation ? (
                  <span className="inline-flex items-center rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-900 ring-1 ring-violet-400/30">
                    Konsultatsiya
                  </span>
                ) : null}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
                {teacher.fullName}
              </h1>
              {teacher.title ? (
                <p className="text-lg text-[var(--muted)]">{teacher.title}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <Link
              href={`/teachers/${teacher.id}/edit`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-teal-200/80 bg-white/90 px-5 py-2.5 text-sm font-semibold text-teal-900 shadow-sm transition hover:border-teal-300 hover:bg-teal-50"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Profilni tahrirlash
            </Link>
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
                className="rounded-full bg-white/90 px-4 py-1.5 text-sm font-medium text-teal-950 ring-1 ring-teal-100 shadow-sm"
              >
                {s}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="space-y-4 lg:col-span-1">
          <div className="rounded-3xl border border-white/60 bg-[color:var(--surface)] p-6 shadow-lg shadow-black/5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Aloqa</h2>
            <ul className="mt-4 space-y-4 text-[var(--ink-soft)]">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 ring-1 ring-teal-100">
                  <Phone className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Telefon</p>
                  <p className="font-medium text-[var(--ink)]">{teacher.phone ?? "—"}</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-white/60 bg-[color:var(--surface)] p-6 shadow-lg shadow-black/5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Profil</h2>
            <p className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)]">
              <Calendar className="h-4 w-4 shrink-0" aria-hidden />
              Ro‘yxatdan o‘tgan: {created}
            </p>
          </div>
        </aside>

        <article className="space-y-6 lg:col-span-2">
          <TeacherPaymentsSection
            payments={teacherPayments}
            totalTeacherShareSom={totalTeacherShareSom}
            lessonEarningsSom={lessonEarningsSom}
          />
        </article>
      </div>
    </div>
  );
}
