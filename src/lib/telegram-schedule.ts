import { LessonKind } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { formatSomUZS } from "@/lib/format-currency";
import { sendTelegramText } from "@/lib/telegram";

const TASHKENT_TZ = "Asia/Tashkent";

function tomorrowDateIsoInTashkent(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TASHKENT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value ?? "1970");
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "01");
  const day = Number(parts.find((p) => p.type === "day")?.value ?? "01");
  const d = new Date(Date.UTC(year, month - 1, day + 1));
  return d.toISOString().slice(0, 10);
}

function clock(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function dateFromIso(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

function humanDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

type SendStats = { total: number; sent: number; failed: number; dateIso: string };

export async function sendTeachersTomorrowSchedules(opts?: { teacherId?: string }): Promise<SendStats> {
  const dateIso = tomorrowDateIsoInTashkent();
  const lessonDate = dateFromIso(dateIso);
  const teachers = await prisma.teacher.findMany({
    where: {
      isActive: true,
      telegramChatId: { not: null },
      ...(opts?.teacherId ? { id: opts.teacherId } : {}),
    },
    select: { id: true, fullName: true, telegramChatId: true },
    orderBy: [{ listNumber: "asc" }, { fullName: "asc" }],
  });

  let sent = 0;
  let failed = 0;
  for (const t of teachers) {
    const lessons = await prisma.lesson.findMany({
      where: { kind: LessonKind.LESSON, teacherId: t.id, lessonDate },
      select: { startMinutes: true, endMinutes: true, student: { select: { fullName: true } } },
      orderBy: [{ startMinutes: "asc" }],
    });
    if (!t.telegramChatId) {
      failed += 1;
      continue;
    }
    const header = `Ertangi kun jadvali (${humanDate(dateIso)})`;
    const body =
      lessons.length > 0
        ? lessons.map((L) => `${clock(L.startMinutes)}-${clock(L.endMinutes)} ${L.student.fullName}`).join("\n")
        : "Ertaga dars belgilanmagan.";
    const text = `${header}\n${body}`;
    const r = await sendTelegramText(t.telegramChatId, text);
    if (r.ok) sent += 1;
    else failed += 1;
  }
  return { total: teachers.length, sent, failed, dateIso };
}

export async function sendStudentsTomorrowSchedules(opts?: { studentId?: string }): Promise<SendStats> {
  const dateIso = tomorrowDateIsoInTashkent();
  const lessonDate = dateFromIso(dateIso);
  const students = await prisma.student.findMany({
    where: {
      isActive: true,
      telegramChatId: { not: null },
      ...(opts?.studentId ? { id: opts.studentId } : {}),
    },
    select: { id: true, fullName: true, telegramChatId: true },
    orderBy: [{ fullName: "asc" }],
  });

  let sent = 0;
  let failed = 0;
  for (const s of students) {
    const [lessons, debtAgg] = await Promise.all([
      prisma.lesson.findMany({
        where: { kind: LessonKind.LESSON, studentId: s.id, lessonDate },
        select: {
          startMinutes: true,
          endMinutes: true,
          teacher: { select: { fullName: true } },
        },
        orderBy: [{ startMinutes: "asc" }],
      }),
      prisma.studentDebt.aggregate({
        where: { studentId: s.id },
        _sum: { amountSom: true },
      }),
    ]);
    if (!s.telegramChatId) {
      failed += 1;
      continue;
    }

    const debtSom = debtAgg._sum.amountSom ?? 0;
    const header = `Ertangi kun jadvali (${humanDate(dateIso)})`;
    const body =
      lessons.length > 0
        ? lessons.map((L) => `${clock(L.startMinutes)}-${clock(L.endMinutes)} ${L.teacher.fullName}`).join("\n")
        : "Ertaga dars belgilanmagan.";
    const debtLine = debtSom > 0 ? `\nQarzdorlik: ${formatSomUZS(debtSom)} so‘m` : "";
    const text = `${header}\n${body}${debtLine}`;

    const r = await sendTelegramText(s.telegramChatId, text);
    if (r.ok) sent += 1;
    else failed += 1;
  }
  return { total: students.length, sent, failed, dateIso };
}
