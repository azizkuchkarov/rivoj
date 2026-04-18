import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

import { updateTeacher } from "@/app/teachers/actions";
import { TeacherForm } from "@/components/teachers/TeacherForm";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTeacherPage({ params }: PageProps) {
  const { id } = await params;

  let teacher;
  try {
    teacher = await prisma.teacher.findUnique({ where: { id } });
  } catch {
    return <DbUnavailable />;
  }

  if (!teacher) notFound();

  const boundUpdate = updateTeacher.bind(null, teacher.id);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <nav className="text-sm text-[var(--muted)]">
          <Link href="/teachers" className="font-medium text-teal-800/90 underline-offset-4 hover:underline">
            O‘qituvchilar
          </Link>
          <span className="mx-2 text-zinc-300">/</span>
          <Link
            href={`/teachers/${teacher.id}`}
            className="font-medium text-teal-800/90 underline-offset-4 hover:underline"
          >
            {teacher.fullName}
          </Link>
          <span className="mx-2 text-zinc-300">/</span>
          <span className="text-[var(--ink-soft)]">Tahrirlash</span>
        </nav>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
          Profilni tahrirlash
        </h1>
        <p className="text-[15px] text-[var(--muted)]">O‘zgarishlar saqlangach profil sahifasiga yo‘naltiriladi.</p>
      </div>

      <div className="rounded-[2rem] border border-white/70 bg-[color:var(--surface)] p-6 shadow-xl shadow-black/5 md:p-10">
        <TeacherForm
          action={boundUpdate}
          defaultValues={teacher}
          submitLabel="O‘zgarishlarni saqlash"
        />
      </div>
    </div>
  );
}
