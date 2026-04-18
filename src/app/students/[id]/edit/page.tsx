import Link from "next/link";
import { notFound } from "next/navigation";

import { updateStudent } from "@/app/students/actions";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { StudentForm } from "@/components/students/StudentForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditStudentPage({ params }: PageProps) {
  const { id } = await params;

  let student;
  let teachers;
  try {
    [student, teachers] = await Promise.all([
      prisma.student.findUnique({ where: { id } }),
      prisma.teacher.findMany({
        orderBy: [{ listNumber: "asc" }, { fullName: "asc" }],
        select: { id: true, fullName: true, isActive: true, listNumber: true },
      }),
    ]);
  } catch {
    return <DbUnavailable />;
  }

  if (!student) notFound();

  const boundUpdate = updateStudent.bind(null, student.id);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <nav className="text-sm text-[var(--muted)]">
          <Link href="/students" className="font-medium text-violet-800/90 underline-offset-4 hover:underline">
            O‘quvchilar
          </Link>
          <span className="mx-2 text-zinc-300">/</span>
          <Link
            href={`/students/${student.id}`}
            className="font-medium text-violet-800/90 underline-offset-4 hover:underline"
          >
            {student.fullName}
          </Link>
          <span className="mx-2 text-zinc-300">/</span>
          <span className="text-[var(--ink-soft)]">Tahrirlash</span>
        </nav>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
          O‘quvchini tahrirlash
        </h1>
        <p className="text-[15px] text-[var(--muted)]">Saqlangach profil sahifasiga qaytadi.</p>
      </div>

      <div className="rounded-[2rem] border border-white/70 bg-[color:var(--surface)] p-6 shadow-xl shadow-black/5 md:p-10">
        <StudentForm
          action={boundUpdate}
          teachers={teachers}
          defaultValues={student}
          submitLabel="O‘zgarishlarni saqlash"
        />
      </div>
    </div>
  );
}
