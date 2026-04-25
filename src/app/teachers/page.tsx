import { TeachersPageView } from "@/components/teachers/TeachersPageView";
import type { TeacherRow } from "@/components/teachers/teachers-columns";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ holat?: string }>;
};

export default async function TeachersPage({ searchParams }: PageProps) {
  const holatParam = (await searchParams).holat;
  const holatFilter: "all" | "faol" | "nofaol" =
    holatParam === "faol" ? "faol" : holatParam === "nofaol" ? "nofaol" : "all";

  const where =
    holatFilter === "faol"
      ? { isActive: true }
      : holatFilter === "nofaol"
        ? { isActive: false }
        : {};

  let teachers;
  let totalTeachers = 0;
  let activeTeachers = 0;
  let inactiveTeachers = 0;
  let studentsWithPrimary = 0;

  try {
    const [list, cTotal, cActive, cInactive, cLinked] = await Promise.all([
      prisma.teacher.findMany({
        where,
        orderBy: [{ isActive: "desc" }, { listNumber: "asc" }, { fullName: "asc" }],
        include: {
          _count: {
            select: { students: true, lessons: true },
          },
        },
      }),
      prisma.teacher.count(),
      prisma.teacher.count({ where: { isActive: true } }),
      prisma.teacher.count({ where: { isActive: false } }),
      prisma.student.count({ where: { primaryTeacherId: { not: null } } }),
    ]);
    teachers = list;
    totalTeachers = cTotal;
    activeTeachers = cActive;
    inactiveTeachers = cInactive;
    studentsWithPrimary = cLinked;
  } catch {
    return <DbUnavailable />;
  }

  const emptyByFilter = teachers.length === 0 && totalTeachers > 0;

  const tableRows: TeacherRow[] = teachers.map((t) => ({
    id: t.id,
    listNumber: t.listNumber,
    fullName: t.fullName,
    isActive: t.isActive,
    studentCount: t._count.students,
    lessonCount: t._count.lessons,
  }));

  return (
    <TeachersPageView
      teachers={teachers}
      tableRows={tableRows}
      holatFilter={holatFilter}
      stats={{
        totalTeachers,
        activeTeachers,
        inactiveTeachers,
        studentsWithPrimary,
      }}
      emptyByFilter={emptyByFilter}
    />
  );
}
