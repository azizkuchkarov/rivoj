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
  let teacherPayments;
  let totalTeacherShareSom = 0;
  let lessonEarningsSom = 0;
  try {
    const [t, payList, shareAgg, earnAgg] = await Promise.all([
      prisma.teacher.findUnique({ where: { id } }),
      prisma.payment.findMany({
        where: { teacherId: id },
        include: { student: { select: { id: true, fullName: true } } },
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      }),
      prisma.payment.aggregate({
        where: { teacherId: id },
        _sum: { teacherShareSom: true },
      }),
      prisma.teacherLessonEarning.aggregate({
        where: { teacherId: id },
        _sum: { amountSom: true },
      }),
    ]);
    teacher = t;
    teacherPayments = payList;
    totalTeacherShareSom = shareAgg._sum.teacherShareSom ?? 0;
    lessonEarningsSom = earnAgg._sum.amountSom ?? 0;
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
        teacherPayments={teacherPayments}
        totalTeacherShareSom={totalTeacherShareSom}
        lessonEarningsSom={lessonEarningsSom}
      />
    </div>
  );
}
