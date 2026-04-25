import { LessonKind, LessonAttendance, SystemProfileRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { formatSomUZS } from "@/lib/format-currency";
import { sendTelegramText } from "@/lib/telegram";

const TASHKENT_TZ = "Asia/Tashkent";

function tashkentDateIso(offsetDays = 0): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TASHKENT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")?.value ?? "1970");
  const m = Number(parts.find((p) => p.type === "month")?.value ?? "01");
  const d = Number(parts.find((p) => p.type === "day")?.value ?? "01");
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays));
  return dt.toISOString().slice(0, 10);
}

function dateFromIso(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`);
}

function humanDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function clock(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mm = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${mm}`;
}

async function getTomorrowTeachersListText(dateIso: string): Promise<string> {
  const lessonDate = dateFromIso(dateIso);
  const lessons = await prisma.lesson.findMany({
    where: { kind: LessonKind.LESSON, lessonDate },
    select: {
      teacherId: true,
      startMinutes: true,
      endMinutes: true,
      teacher: { select: { fullName: true, listNumber: true } },
      student: { select: { fullName: true } },
    },
    orderBy: [{ teacherId: "asc" }, { startMinutes: "asc" }],
  });
  if (lessons.length === 0) return "Ertaga dars belgilanmagan.";

  const grouped = new Map<string, { teacher: string; rows: string[] }>();
  for (const L of lessons) {
    const key = L.teacherId;
    const teacherTitle = `№${L.teacher.listNumber} ${L.teacher.fullName}`;
    const line = `${clock(L.startMinutes)}-${clock(L.endMinutes)} ${L.student.fullName}`;
    const current = grouped.get(key) ?? { teacher: teacherTitle, rows: [] };
    current.rows.push(line);
    grouped.set(key, current);
  }
  return [...grouped.values()]
    .map((g) => `${g.teacher}\n${g.rows.map((r) => `- ${r}`).join("\n")}`)
    .join("\n\n");
}

export async function sendManager1800Report() {
  const profile = await prisma.systemProfile.findUnique({
    where: { role: SystemProfileRole.MANAGER },
    select: { telegramChatId: true, isActive: true, fullName: true },
  });
  if (!profile?.isActive || !profile.telegramChatId) {
    return { ok: false as const, reason: "Manager profile faol emas yoki telegram ID yo‘q" };
  }

  const todayIso = tashkentDateIso(0);
  const today = dateFromIso(todayIso);
  const tomorrow = dateFromIso(tashkentDateIso(1));

  const [todayLessonsCount, todayLessonsSum, debtAgg] = await Promise.all([
    prisma.lesson.count({
      where: {
        kind: LessonKind.LESSON,
        attendance: LessonAttendance.PRESENT,
        lessonDate: { gte: today, lt: tomorrow },
      },
    }),
    prisma.payment.aggregate({
      where: {
        lesson: {
          kind: LessonKind.LESSON,
          attendance: LessonAttendance.PRESENT,
          lessonDate: { gte: today, lt: tomorrow },
        },
      },
      _sum: { amountSom: true },
    }),
    prisma.studentDebt.aggregate({
      _sum: { amountSom: true },
      _count: { _all: true },
    }),
  ]);

  const msg =
    `Bugungi umumiy hisobot (${humanDate(todayIso)})\n` +
    `Umumiy darslar: ${todayLessonsCount} ta\n` +
    `Summa: ${formatSomUZS(todayLessonsSum._sum.amountSom ?? 0)} so‘m\n` +
    `Qarzdorlik: ${debtAgg._count._all} ta\n` +
    `Qarzdorlik summasi: ${formatSomUZS(debtAgg._sum.amountSom ?? 0)} so‘m`;

  const sent = await sendTelegramText(profile.telegramChatId, msg);
  return sent.ok ? { ok: true as const } : { ok: false as const, reason: sent.reason };
}

export async function sendManagerAndAdmin1900Report() {
  const tomorrowIso = tashkentDateIso(1);
  const scheduleText = await getTomorrowTeachersListText(tomorrowIso);

  const [todayLessonsCount, debtCount] = await Promise.all([
    prisma.lesson.count({
      where: {
        kind: LessonKind.LESSON,
        attendance: LessonAttendance.PRESENT,
        lessonDate: { gte: dateFromIso(tashkentDateIso(0)), lt: dateFromIso(tomorrowIso) },
      },
    }),
    prisma.studentDebt.count(),
  ]);

  const manager = await prisma.systemProfile.findUnique({
    where: { role: SystemProfileRole.MANAGER },
    select: { telegramChatId: true, isActive: true },
  });
  const admin = await prisma.systemProfile.findUnique({
    where: { role: SystemProfileRole.ADMIN },
    select: { telegramChatId: true, isActive: true },
  });

  const managerMsg =
    `Ertangi umumiy jadval (${humanDate(tomorrowIso)})\n` +
    `${scheduleText}`;
  const adminMsg =
    `Ertangi umumiy jadval (${humanDate(tomorrowIso)})\n` +
    `Bugungi darslar: ${todayLessonsCount} ta\n` +
    `Qarzdorlik: ${debtCount} ta\n\n` +
    `${scheduleText}`;

  let sent = 0;
  let failed = 0;
  if (manager?.isActive && manager.telegramChatId) {
    const r = await sendTelegramText(manager.telegramChatId, managerMsg);
    if (r.ok) sent += 1;
    else failed += 1;
  }
  if (admin?.isActive && admin.telegramChatId) {
    const r = await sendTelegramText(admin.telegramChatId, adminMsg);
    if (r.ok) sent += 1;
    else failed += 1;
  }
  return { sent, failed, dateIso: tomorrowIso };
}
