import Link from "next/link";

import { createStudent } from "@/app/students/actions";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { StudentForm } from "@/components/students/StudentForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewStudentPage() {
  let teachers;
  try {
    teachers = await prisma.teacher.findMany({
      orderBy: [{ listNumber: "asc" }, { fullName: "asc" }],
      select: { id: true, fullName: true, isActive: true, listNumber: true },
    });
  } catch {
    return <DbUnavailable />;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/students"
          className="text-sm font-medium text-violet-800 underline-offset-4 hover:underline"
        >
          ← O‘quvchilar ro‘yxati
        </Link>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
          Yangi o‘quvchi
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
          Ma’lumotlarni to‘ldirib boring — keyin jadval va uchrashuvlar bilan bog‘lash oson bo‘ladi.
        </p>
      </div>

      <div className="rounded-[2rem] border border-border bg-[color:var(--surface)] p-6 shadow-sm md:p-10">
        <StudentForm action={createStudent} teachers={teachers} submitLabel="Saqlash" />
      </div>
    </div>
  );
}
