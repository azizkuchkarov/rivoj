import Link from "next/link";

import { createTeacher } from "@/app/teachers/actions";
import { TeacherForm } from "@/components/teachers/TeacherForm";
import { prisma } from "@/lib/prisma";

export default async function NewTeacherPage() {
  const agg = await prisma.teacher.aggregate({ _max: { listNumber: true } });
  const suggestedListNumber = (agg._max.listNumber ?? 0) + 1;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/teachers"
          className="text-sm font-medium text-indigo-800 underline-offset-4 hover:underline"
        >
          ← O‘qituvchilar ro‘yxati
        </Link>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
          Yangi o‘qituvchi profili
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
          № raqami ro‘yxat va dars jadvalida tartibni belgilaydi. Takroriy raqam kiritib bo‘lmaydi.
        </p>
      </div>

      <div className="rounded-[2rem] border border-border bg-[color:var(--surface)] p-6 shadow-sm md:p-10">
        <TeacherForm
          action={createTeacher}
          suggestedListNumber={suggestedListNumber}
          submitLabel="Profilni saqlash"
        />
      </div>
    </div>
  );
}
