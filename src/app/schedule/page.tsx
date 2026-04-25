import { ScheduleDayMatrixView } from "@/components/schedule/ScheduleDayMatrixView";
import { ScheduleWeekView } from "@/components/schedule/ScheduleWeekView";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { prisma } from "@/lib/prisma";
import { SCHEDULE_LESSON_PATH } from "@/lib/schedule-paths";
import { addDaysUTC, parseDayParam, parseWeekMondayParam, startOfWeekMondayUTC, toISODateStringUTC } from "@/lib/week-utils";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ week?: string; view?: string; date?: string; teacherId?: string; startMinutes?: string }>;
};

export default async function SchedulePage({ searchParams }: PageProps) {
  const { week, view, date, teacherId, startMinutes } = await searchParams;
  const mode = view === "day" ? "day" : "week";

  if (mode === "day") {
    const dayDate = parseDayParam(date);
    const weekMondayIso = toISODateStringUTC(startOfWeekMondayUTC(dayDate));

    let lessons;
    let teachers;
    try {
      [lessons, teachers] = await Promise.all([
        prisma.lesson.findMany({
          where: { lessonDate: dayDate },
          include: {
            teacher: { select: { id: true, fullName: true, listNumber: true } },
            student: { select: { id: true, fullName: true } },
          },
          orderBy: [{ startMinutes: "asc" }],
        }),
        prisma.teacher.findMany({
          where: { isActive: true },
          select: { id: true, fullName: true, listNumber: true },
          orderBy: [{ listNumber: "asc" }, { fullName: "asc" }],
        }),
      ]);
    } catch {
      return <DbUnavailable />;
    }

    return (
      <ScheduleDayMatrixView
        variant="lesson"
        basePath={SCHEDULE_LESSON_PATH}
        day={dayDate}
        lessons={lessons}
        teachers={teachers}
        weekMondayIso={weekMondayIso}
        selectedTeacherId={teacherId && teachers.some((t) => t.id === teacherId) ? teacherId : undefined}
        selectedStartMinutes={startMinutes ? Number.parseInt(startMinutes, 10) : undefined}
      />
    );
  }

  const monday = parseWeekMondayParam(week);
  const sunday = addDaysUTC(monday, 6);

  let lessons;
  try {
    lessons = await prisma.lesson.findMany({
      where: {
        lessonDate: {
          gte: monday,
          lte: sunday,
        },
      },
      include: {
        teacher: { select: { id: true, fullName: true, listNumber: true } },
        student: { select: { id: true, fullName: true } },
      },
      orderBy: [{ lessonDate: "asc" }, { startMinutes: "asc" }],
    });
  } catch {
    return <DbUnavailable />;
  }

  return <ScheduleWeekView variant="lesson" basePath={SCHEDULE_LESSON_PATH} weekMonday={monday} lessons={lessons} />;
}
