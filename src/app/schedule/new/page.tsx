import Link from "next/link";

import { LessonPlannerForm } from "@/components/schedule/LessonPlannerForm";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { prisma } from "@/lib/prisma";
import { getSlotStartMinutesList } from "@/lib/time-minutes";
import { startOfWeekMondayUTC, toISODateStringUTC } from "@/lib/week-utils";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    lessonDate?: string;
    teacherId?: string;
    studentId?: string;
    startMinutes?: string;
    reuseSubscription?: string;
  }>;
};

export default async function NewLessonPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  let teachers;
  let students;
  try {
    [teachers, students] = await Promise.all([
      prisma.teacher.findMany({
        orderBy: [{ listNumber: "asc" }, { fullName: "asc" }],
        select: { id: true, fullName: true, isActive: true, listNumber: true },
      }),
      prisma.student.findMany({ orderBy: { fullName: "asc" }, select: { id: true, fullName: true, isActive: true } }),
    ]);
  } catch {
    return <DbUnavailable />;
  }

  const today = new Date().toISOString().slice(0, 10);
  const dateParam = sp.lessonDate?.trim();
  const defaultLessonDate =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;

  const slots = getSlotStartMinutesList();
  const teacherOk = Boolean(sp.teacherId && teachers.some((t) => t.id === sp.teacherId));
  const studentOk = Boolean(sp.studentId && students.some((s) => s.id === sp.studentId));
  const defaultTeacherId = teacherOk ? sp.teacherId! : "";
  const defaultStudentId = studentOk ? sp.studentId! : "";

  const parsedStart = sp.startMinutes != null ? Number.parseInt(String(sp.startMinutes), 10) : NaN;
  const defaultStartMinutes = Number.isFinite(parsedStart) && slots.includes(parsedStart) ? parsedStart : undefined;

  const anchorForWeek =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;
  const initialWeekMondayIso = toISODateStringUTC(
    startOfWeekMondayUTC(new Date(`${anchorForWeek}T12:00:00.000Z`)),
  );

  const fromGrid = Boolean(defaultTeacherId || defaultStartMinutes != null || (dateParam && dateParam !== today));
  const reuseSubscription = sp.reuseSubscription === "1";
  const initialSlots =
    !reuseSubscription && dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && defaultStartMinutes != null
      ? [{ lessonDate: dateParam, startMinutes: defaultStartMinutes }]
      : [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/schedule"
          className="text-sm font-medium text-teal-800/90 underline-offset-4 hover:underline"
        >
          ← Dars jadvali
        </Link>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
          Yangi dars
        </h1>
        <p className="max-w-2xl text-[15px] text-[var(--muted)]">
          O‘qituvchi va o‘quvchini tanlang, <strong>to‘lovni</strong> (bir martalik yoki abonentlik) kiriting — keyin
          haftalik jadval ochiladi. Bo‘sh kataklarni bosing, izoh qo‘shing va <strong>tasdiqlash</strong> bilan
          barcha darslar va to‘lov birgalikda saqlanadi.
        </p>
        {fromGrid ? (
          <p className="max-w-2xl rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-sm text-teal-950">
            Jadvaldan: sana va vaqt (va kunlik ko‘rinishda o‘qituvchi) oldindan berilgan.{" "}
            <strong>O‘quvchini</strong> tanlang, kerak bo‘lsa yana slotlarni belgilang, keyin tasdiqlang.
          </p>
        ) : null}
      </div>

      <div className="rounded-[2rem] border border-white/70 bg-[color:var(--surface)] p-6 shadow-xl shadow-black/5 md:p-10">
        <LessonPlannerForm
          key={`${defaultLessonDate}-${defaultTeacherId}-${defaultStudentId}-${initialWeekMondayIso}-${reuseSubscription ? "reuse" : "new"}`}
          teachers={teachers}
          students={students}
          initialTeacherId={defaultTeacherId}
          initialStudentId={defaultStudentId}
          initialWeekMondayIso={initialWeekMondayIso}
          initialSlots={initialSlots}
          reuseSubscription={reuseSubscription}
        />
      </div>
    </div>
  );
}
