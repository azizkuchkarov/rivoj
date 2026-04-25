import Link from "next/link";

import { Baby, Calendar, Pencil, Phone, User } from "lucide-react";

import { deleteStudent } from "@/app/students/actions";
import { DeleteConfirmForm } from "@/components/common/DeleteConfirmForm";
import {
  StudentPaymentsSection,
  type GuardianDebtRow,
} from "@/components/students/StudentPaymentsSection";
import { StudentScheduleSection, type StudentProfileLesson } from "@/components/students/StudentScheduleSection";
import { StudentTelegramTestButton } from "@/components/students/StudentTelegramTestButton";
import { Avatar } from "@/components/teachers/Avatar";
import type { Payment, Student, Teacher } from "@/generated/prisma/client";
import { LessonAttendance, LessonGuardianFee } from "@/generated/prisma/enums";
import { ageFromDateOfBirth } from "@/lib/age";
import { formatStudentGender } from "@/lib/student-gender";

type PaymentWithTeacher = Payment & {
  teacher: Pick<Teacher, "id" | "fullName"> | null;
  lesson: {
    lessonDate: Date;
    startMinutes: number;
    attendance: LessonAttendance;
    guardianFee: LessonGuardianFee;
    teacher: { id: string; fullName: string; listNumber: number };
  } | null;
};

type StudentProfileProps = {
  student: Student & { primaryTeacher: Pick<Teacher, "id" | "fullName" | "title"> | null };
  paymentSummary?: { totalSom: number; count: number };
  payments?: PaymentWithTeacher[];
  guardianDebts?: GuardianDebtRow[];
  debtTotalSom?: number;
  subscriptionLessonsRemainingTotal?: number;
  upcomingLessons?: StudentProfileLesson[];
};

export function StudentProfile({
  student,
  paymentSummary,
  payments = [],
  guardianDebts = [],
  debtTotalSom = 0,
  subscriptionLessonsRemainingTotal = 0,
  upcomingLessons = [],
}: StudentProfileProps) {
  const totalSom = paymentSummary?.totalSom ?? 0;
  const created = new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(student.createdAt);

  const dobFormatted =
    student.dateOfBirth != null
      ? new Intl.DateTimeFormat("uz-UZ", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(student.dateOfBirth)
      : null;

  const age = student.dateOfBirth != null ? ageFromDateOfBirth(student.dateOfBirth) : null;
  const genderLabel = formatStudentGender(student.gender);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-white p-8 shadow-sm md:p-10">

        <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <Avatar name={student.fullName} size="xl" />
            <div className="min-w-0 space-y-2 pb-0.5">
              <div className="flex flex-wrap items-center gap-2">
                {student.isActive ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-900 ring-1 ring-emerald-300">
                    Faol
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-zinc-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700">
                    Nofaol
                  </span>
                )}
                {age !== null ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-violet-950 ring-1 ring-violet-100">
                    <Baby className="h-3.5 w-3.5" aria-hidden />
                    {age} yosh
                  </span>
                ) : null}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
                {student.fullName}
              </h1>
              {genderLabel ? (
                <p className="text-lg text-[var(--muted)]">{genderLabel}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <Link
              href={`/students/${student.id}/edit`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-violet-200 bg-white px-5 py-2.5 text-sm font-semibold text-violet-900 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Profilni tahrirlash
            </Link>
            <StudentTelegramTestButton studentId={student.id} />
            <DeleteConfirmForm
              action={deleteStudent}
              id={student.id}
              displayName={student.fullName}
              entityLabel="O‘quvchini"
            />
          </div>
        </div>

        {student.focusAreas.length > 0 ? (
          <ul className="relative mt-8 flex flex-wrap gap-2">
            {student.focusAreas.map((s) => (
              <li
                key={s}
                className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-violet-950 ring-1 ring-violet-100 shadow-sm"
              >
                {s}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="relative mt-5 grid gap-2 text-sm text-[var(--ink-soft)] md:grid-cols-2">
          <p className="inline-flex items-center gap-2">
            <User className="h-4 w-4 text-violet-700" aria-hidden />
            <span className="font-medium text-[var(--ink)]">Vasiy:</span> {student.guardianName ?? "—"}
          </p>
          <p className="inline-flex items-center gap-2">
            <Phone className="h-4 w-4 text-violet-700" aria-hidden />
            <span className="font-medium text-[var(--ink)]">Vasiy telefoni:</span> {student.guardianPhone ?? "—"}
          </p>
          <p className="inline-flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-700" aria-hidden />
            <span className="font-medium text-[var(--ink)]">Tug‘ilgan sana:</span> {dobFormatted ?? "—"}
          </p>
          <p className="inline-flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-700" aria-hidden />
            <span className="font-medium text-[var(--ink)]">Ro‘yxatga olingan:</span> {created}
          </p>
          <p className="md:col-span-2">
            <span className="font-medium text-[var(--ink)]">Asosiy o‘qituvchi:</span>{" "}
            {student.primaryTeacher ? (
              <Link
                href={`/teachers/${student.primaryTeacher.id}`}
                className="font-medium text-violet-800 underline-offset-4 hover:underline"
              >
                {student.primaryTeacher.fullName}
              </Link>
            ) : (
              <span className="font-medium text-[var(--ink)]">—</span>
            )}
            {student.primaryTeacher?.title ? <span className="text-zinc-400"> ({student.primaryTeacher.title})</span> : null}
          </p>
        </div>
      </section>

      <StudentScheduleSection lessons={upcomingLessons} />

      <StudentPaymentsSection
        studentId={student.id}
        studentFullName={student.fullName}
        payments={payments}
        primaryTeacher={student.primaryTeacher}
        guardianDebts={guardianDebts}
        totalSom={totalSom}
        debtTotalSom={debtTotalSom}
        subscriptionLessonsRemainingTotal={subscriptionLessonsRemainingTotal}
      />

      {student.notes?.trim() ? (
        <div className="h-full rounded-3xl border border-border bg-[color:var(--surface)] p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Izoh</h2>
          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ink-soft)]">
            {student.notes.trim()}
          </p>
        </div>
      ) : null}
    </div>
  );
}
