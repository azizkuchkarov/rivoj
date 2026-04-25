import { NextResponse } from "next/server";

import { sendStudentsTomorrowSchedules, sendTeachersTomorrowSchedules } from "@/lib/telegram-schedule";

export async function GET() {
  const [teachers, students] = await Promise.all([sendTeachersTomorrowSchedules(), sendStudentsTomorrowSchedules()]);
  return NextResponse.json({
    ok: true,
    teachers,
    students,
  });
}
