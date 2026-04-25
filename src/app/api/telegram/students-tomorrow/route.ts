import { NextResponse } from "next/server";

import { sendStudentsTomorrowSchedules } from "@/lib/telegram-schedule";

export async function GET() {
  const stats = await sendStudentsTomorrowSchedules();
  return NextResponse.json({
    ok: true,
    students: stats.total,
    sent: stats.sent,
    failed: stats.failed,
    date: stats.dateIso,
  });
}
