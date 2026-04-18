import Link from "next/link";

import { createPayment } from "@/app/payments/actions";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ studentId?: string }>;
};

export default async function NewPaymentPage({ searchParams }: PageProps) {
  const { studentId: studentIdParam } = await searchParams;

  let students;

  try {
    students = await prisma.student.findMany({
      orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
      select: { id: true, fullName: true, isActive: true },
    });
  } catch {
    return <DbUnavailable />;
  }

  const defaultPaidAt = new Date().toISOString().slice(0, 10);
  const defaultStudentId =
    studentIdParam && students.some((s) => s.id === studentIdParam) ? studentIdParam : "";

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href={defaultStudentId ? `/payments?studentId=${defaultStudentId}` : "/payments"}
          className="text-sm font-medium text-violet-800/90 underline-offset-4 hover:underline"
        >
          ← To‘lovlar
        </Link>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
          Yangi to‘lov
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
          Kunlik yoki abonentlik: summalar va ulushlarni kiriting. Abonentlikda har bir dars uchun ulush jadvaldagi
          o‘qituvchiga biriktiriladi.
        </p>
      </div>

      <div className="rounded-[2rem] border border-white/70 bg-[color:var(--surface)] p-6 shadow-xl shadow-black/5 md:p-10">
        <PaymentForm
          action={createPayment}
          students={students}
          defaultStudentId={defaultStudentId}
          defaultPaidAt={defaultPaidAt}
          submitLabel="To‘lovni saqlash"
          redirectAfter="payments"
        />
      </div>
    </div>
  );
}
