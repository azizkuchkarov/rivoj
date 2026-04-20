import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

import { TeacherProfile } from "@/components/teachers/TeacherProfile";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TeacherDetailPage({ params }: PageProps) {
  const { id } = await params;

  let teacher;
  let lessonEarningRows: {
    lessonId: string;
    lessonDateIso: string;
    amountSom: number;
    student: { id: string; fullName: string };
  }[] = [];
  try {
    const [t, earningList] = await Promise.all([
      prisma.teacher.findUnique({ where: { id } }),
      prisma.teacherLessonEarning.findMany({
        where: { teacherId: id },
        select: {
          lessonId: true,
          amountSom: true,
          lesson: {
            select: {
              lessonDate: true,
              student: { select: { id: true, fullName: true } },
            },
          },
        },
        orderBy: [{ lesson: { lessonDate: "desc" } }, { createdAt: "desc" }],
      }),
    ]);
    teacher = t;
    lessonEarningRows = earningList.map((row) => ({
      lessonId: row.lessonId,
      lessonDateIso: row.lesson.lessonDate.toISOString().slice(0, 10),
      amountSom: row.amountSom,
      student: row.lesson.student,
    }));
  } catch {
    return <DbUnavailable />;
  }

  if (!teacher) notFound();

  return (
    <div className="space-y-8">
      <nav className="text-sm text-[var(--muted)]">
        <Link href="/teachers" className="font-medium text-teal-800/90 underline-offset-4 hover:underline">
          O‘qituvchilar
        </Link>
        <span className="mx-2 text-zinc-300">/</span>
        <span className="text-[var(--ink-soft)]">{teacher.fullName}</span>
      </nav>
      <TeacherProfile
        teacher={teacher}
        lessonEarningRows={lessonEarningRows}
      />
    </div>
  );
}
