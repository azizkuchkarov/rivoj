import { NextResponse } from "next/server";

import { LessonAttendance, PaymentKind } from "@/generated/prisma/enums";
import { markLessonAttendance } from "@/app/schedule/lesson-attendance-actions";
import { prisma } from "@/lib/prisma";
import { SCHEDULE_CONSULTATION_PATH, SCHEDULE_LESSON_PATH } from "@/lib/schedule-paths";

const TASHKENT_TZ = "Asia/Tashkent";

function currentTashkentDateTime() {
  const now = new Date();
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TASHKENT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TASHKENT_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const year = Number(dateParts.find((p) => p.type === "year")?.value ?? "1970");
  const month = Number(dateParts.find((p) => p.type === "month")?.value ?? "01");
  const day = Number(dateParts.find((p) => p.type === "day")?.value ?? "01");
  const hour = Number(timeParts.find((p) => p.type === "hour")?.value ?? "00");
  const minute = Number(timeParts.find((p) => p.type === "minute")?.value ?? "00");
  const dateIso = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  return {
    dateIso,
    dateUtc: new Date(Date.UTC(year, month - 1, day)),
    minutesNow: hour * 60 + minute,
  };
}

function formatClock(minutes: number) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export async function GET() {
  const { dateIso, dateUtc, minutesNow } = currentTashkentDateTime();

  const lessons = await prisma.lesson.findMany({
    where: {
      attendance: LessonAttendance.UNMARKED,
      OR: [
        { lessonDate: { lt: dateUtc } },
        {
          lessonDate: dateUtc,
          endMinutes: { lte: minutesNow },
        },
      ],
    },
    select: {
      id: true,
      kind: true,
      lessonDate: true,
      startMinutes: true,
      endMinutes: true,
      teacherId: true,
      teacher: { select: { id: true, fullName: true, listNumber: true } },
      student: { select: { id: true, fullName: true } },
    },
    orderBy: [{ lessonDate: "asc" }, { endMinutes: "asc" }],
    take: 100,
  });

  const studentIds = Array.from(new Set(lessons.map((x) => x.student.id)));
  const openSubscriptions = studentIds.length
    ? await prisma.payment.findMany({
        where: {
          studentId: { in: studentIds },
          kind: PaymentKind.SUBSCRIPTION,
          subscriptionLessonsRemaining: { gt: 0 },
        },
        select: { studentId: true },
      })
    : [];
  const openSubscriptionStudentIds = new Set(openSubscriptions.map((x) => x.studentId));

  const items = lessons.map((l) => {
    const lessonDateIso = l.lessonDate.toISOString().slice(0, 10);
    const isConsultation = l.kind === "CONSULTATION";
    const basePath = isConsultation ? SCHEDULE_CONSULTATION_PATH : SCHEDULE_LESSON_PATH;
    const isSubscription = l.kind === "LESSON" && openSubscriptionStudentIds.has(l.student.id);
    return {
      id: l.id,
      kind: l.kind,
      isSubscription,
      lessonDateIso,
      title: `${l.student.fullName} · №${l.teacher.listNumber} ${l.teacher.fullName}`,
      timeRange: `${formatClock(l.startMinutes)}-${formatClock(l.endMinutes)}`,
      teacherId: l.teacherId,
      teacherName: l.teacher.fullName,
      studentName: l.student.fullName,
      isOverdue: lessonDateIso < dateIso,
      href: `${basePath}?view=day&date=${lessonDateIso}&teacherId=${l.teacherId}&startMinutes=${l.startMinutes}`,
    };
  });

  return NextResponse.json({
    ok: true,
    nowDateIso: dateIso,
    count: items.length,
    items,
  });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  }

  const lessonId = typeof (body as { lessonId?: unknown })?.lessonId === "string" ? (body as { lessonId: string }).lessonId : "";
  const attendance =
    typeof (body as { attendance?: unknown })?.attendance === "string" ? (body as { attendance: string }).attendance : "";
  const guardianFeeRaw =
    typeof (body as { guardianFee?: unknown })?.guardianFee === "string"
      ? (body as { guardianFee: string }).guardianFee
      : "NA";

  if (!lessonId || (attendance !== LessonAttendance.PRESENT && attendance !== LessonAttendance.ABSENT)) {
    return NextResponse.json({ ok: false, error: "Parametrlar noto‘g‘ri." }, { status: 400 });
  }
  if (guardianFeeRaw !== "NA" && guardianFeeRaw !== "PAID" && guardianFeeRaw !== "UNPAID") {
    return NextResponse.json({ ok: false, error: "To‘lov holati noto‘g‘ri." }, { status: 400 });
  }

  const formData = new FormData();
  formData.set("lessonId", lessonId);
  formData.set("attendance", attendance);
  formData.set("guardianFee", guardianFeeRaw);

  const result = await markLessonAttendance({}, formData);
  if (!result.success) {
    return NextResponse.json({ ok: false, error: result.error ?? "Saqlab bo‘lmadi." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, rescheduleUrl: result.rescheduleUrl });
}

