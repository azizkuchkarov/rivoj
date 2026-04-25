import { NextResponse } from "next/server";

import { sendTeachersTomorrowSchedules } from "@/lib/telegram-schedule";

export async function GET(request: Request) {
  const stats = await sendTeachersTomorrowSchedules();

  return NextResponse.json({
    ok: true,
    teachers: stats.total,
    sent: stats.sent,
    failed: stats.failed,
    date: stats.dateIso,
  });
}

