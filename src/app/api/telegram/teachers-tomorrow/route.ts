import { NextResponse } from "next/server";

import { LessonKind } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { sendTelegramText } from "@/lib/telegram";

function formatClock(startMinutes: number): string {
  const h = Math.floor(startMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (startMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function tomorrowUtcDateRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2));
  return { start, end };
}

export async function GET(request: Request) {
  const { start, end } = tomorrowUtcDateRange();
  const lessons = await prisma.lesson.findMany({
    where: {
      kind: LessonKind.LESSON,
      lessonDate: { gte: start, lt: end },
    },
    include: {
      teacher: { select: { id: true, fullName: true, telegramChatId: true } },
      student: { select: { fullName: true } },
    },
    orderBy: [{ teacherId: "asc" }, { startMinutes: "asc" }],
  });

  const byTeacher = new Map<
    string,
    { teacherName: string; telegramChatId: string | null; rows: { time: string; studentName: string }[] }
  >();
  for (const L of lessons) {
    const prev = byTeacher.get(L.teacherId) ?? {
      teacherName: L.teacher.fullName,
      telegramChatId: L.teacher.telegramChatId,
      rows: [],
    };
    prev.rows.push({ time: formatClock(L.startMinutes), studentName: L.student.fullName });
    byTeacher.set(L.teacherId, prev);
  }

  let sent = 0;
  let failed = 0;
  for (const [, t] of byTeacher) {
    const lines = t.rows.map((r, idx) => `${idx + 1}) ${r.time} — ${r.studentName}`);
    const text =
      `Ertangi darslaringiz:\n` +
      `O‘qituvchi: ${t.teacherName}\n` +
      `${lines.length > 0 ? lines.join("\n") : "Dars yo‘q"}`;
    if (!t.telegramChatId) {
      failed += 1;
      continue;
    }
    const r = await sendTelegramText(t.telegramChatId, text);
    if (r.ok) sent += 1;
    else failed += 1;
  }

  return NextResponse.json({
    ok: true,
    teachers: byTeacher.size,
    sent,
    failed,
    date: start.toISOString().slice(0, 10),
  });
}

