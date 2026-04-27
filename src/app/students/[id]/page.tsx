import Link from "next/link";
import { notFound } from "next/navigation";

import { StudentProfile } from "@/components/students/StudentProfile";
import type { GuardianDebtRow } from "@/components/students/StudentPaymentsSection";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { prisma } from "@/lib/prisma";
import { PaymentKind } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params;

  const now = new Date();
  const startOfTodayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  let student;
  let paymentSummary: { totalSom: number; count: number };
  let payments;
  let guardianDebts: GuardianDebtRow[] = [];
  let debtTotalSom = 0;
  let subscriptionLessonsRemainingTotal = 0;
  let upcomingLessons;
  try {
    const [s, payAgg, payList, debtList, debtAgg, subRemainingAgg, lessons] = await Promise.all([
      prisma.student.findUnique({
        where: { id },
        include: {
          primaryTeacher: { select: { id: true, fullName: true, title: true } },
        },
      }),
      prisma.payment.aggregate({
        where: { studentId: id },
        _sum: { amountSom: true },
        _count: true,
      }),
      prisma.payment.findMany({
        where: { studentId: id },
        include: {
          teacher: { select: { id: true, fullName: true } },
          lesson: {
            select: {
              lessonDate: true,
              startMinutes: true,
              attendance: true,
              guardianFee: true,
              teacher: { select: { id: true, fullName: true, listNumber: true } },
            },
          },
        },
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      }),
      prisma.studentDebt.findMany({
        where: { studentId: id },
        select: {
          id: true,
          amountSom: true,
          lessonId: true,
          lesson: {
            select: {
              lessonDate: true,
              teacher: { select: { id: true, fullName: true, listNumber: true } },
            },
          },
        },
        orderBy: { lesson: { lessonDate: "desc" } },
      }),
      prisma.studentDebt.aggregate({
        where: { studentId: id },
        _sum: { amountSom: true },
      }),
      prisma.payment.aggregate({
        where: { studentId: id, kind: PaymentKind.SUBSCRIPTION },
        _sum: { subscriptionLessonsRemaining: true },
      }),
      prisma.lesson.findMany({
        where: {
          studentId: id,
          lessonDate: { gte: startOfTodayUtc },
        },
        select: {
          id: true,
          lessonDate: true,
          startMinutes: true,
          endMinutes: true,
          kind: true,
          attendance: true,
          guardianFee: true,
          teacher: { select: { id: true, fullName: true, listNumber: true } },
        },
        orderBy: [{ lessonDate: "asc" }, { startMinutes: "asc" }],
        take: 100,
      }),
    ]);
    student = s;
    paymentSummary = {
      totalSom: payAgg._sum.amountSom ?? 0,
      count: payAgg._count,
    };
    payments = payList;
    guardianDebts = debtList;
    debtTotalSom = debtAgg._sum.amountSom ?? 0;
    subscriptionLessonsRemainingTotal = subRemainingAgg._sum.subscriptionLessonsRemaining ?? 0;
    upcomingLessons = lessons;
  } catch {
    return <DbUnavailable />;
  }

  if (!student) notFound();

  return (
    <div className="space-y-8">
      <nav className="text-sm text-black">
        <Link href="/students" className="font-medium text-violet-800/90 underline-offset-4 hover:underline">
          O‘quvchilar
        </Link>
        <span className="mx-2 text-zinc-300">/</span>
        <span className="text-[var(--ink-soft)]">{student.fullName}</span>
      </nav>
      <StudentProfile
        student={student}
        paymentSummary={paymentSummary}
        payments={payments}
        guardianDebts={guardianDebts}
        debtTotalSom={debtTotalSom}
        subscriptionLessonsRemainingTotal={subscriptionLessonsRemainingTotal}
        upcomingLessons={upcomingLessons}
      />
    </div>
  );
}
