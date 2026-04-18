import { ScheduleDayMatrixView } from "@/components/schedule/ScheduleDayMatrixView";
import { ScheduleWeekView } from "@/components/schedule/ScheduleWeekView";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { prisma } from "@/lib/prisma";
import { SCHEDULE_CONSULTATION_PATH } from "@/lib/schedule-paths";
import { addDaysUTC, parseDayParam, parseWeekMondayParam, startOfWeekMondayUTC, toISODateStringUTC } from "@/lib/week-utils";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ week?: string; view?: string; date?: string }>;
};

export default async function ConsultationSchedulePage({ searchParams }: PageProps) {
  const { week, view, date } = await searchParams;
  const mode = view === "day" ? "day" : "week";

  if (mode === "day") {
    const dayDate = parseDayParam(date);
    const weekMondayIso = toISODateStringUTC(startOfWeekMondayUTC(dayDate));

    let lessons;
    let teachers;
    try {
      lessons = await prisma.lesson.findMany({
        where: { lessonDate: dayDate },
        include: {
          teacher: { select: { id: true, fullName: true, listNumber: true } },
          student: { select: { id: true, fullName: true } },
        },
        orderBy: [{ startMinutes: "asc" }],
      });
      const busyTeacherIds = [...new Set(lessons.map((l) => l.teacherId))];
      teachers = await prisma.teacher.findMany({
        where:
          busyTeacherIds.length > 0
            ? {
                isActive: true,
                OR: [{ offersConsultation: true }, { id: { in: busyTeacherIds } }],
              }
            : { isActive: true, offersConsultation: true },
        select: { id: true, fullName: true, listNumber: true },
        orderBy: [{ listNumber: "asc" }, { fullName: "asc" }],
      });
    } catch {
      return <DbUnavailable />;
    }

    return (
      <ScheduleDayMatrixView
        variant="consultation"
        basePath={SCHEDULE_CONSULTATION_PATH}
        day={dayDate}
        lessons={lessons}
        teachers={teachers}
        weekMondayIso={weekMondayIso}
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

  return (
    <ScheduleWeekView
      variant="consultation"
      basePath={SCHEDULE_CONSULTATION_PATH}
      weekMonday={monday}
      lessons={lessons}
    />
  );
}
