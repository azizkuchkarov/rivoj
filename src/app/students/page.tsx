import Link from "next/link";

import { ChartColumnBig, UserPlus, Users } from "lucide-react";

import { StudentsDataTable } from "@/components/students/StudentsDataTable";
import type { StudentRow } from "@/components/students/students-columns";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  let students;
  try {
    students = await prisma.student.findMany({
      orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
      include: {
        primaryTeacher: { select: { id: true, fullName: true } },
      },
    });
  } catch {
    return <DbUnavailable />;
  }

  const rows: StudentRow[] = students.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    isActive: s.isActive,
    primaryTeacherName: s.primaryTeacher?.fullName ?? null,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Users className="size-3.5" aria-hidden />
            Bolalar
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">O‘quvchilar</h1>
          <p className="max-w-xl text-sm text-muted-foreground md:text-[15px] md:leading-relaxed">
            Ro‘yxat va qidiruv: vasiy va asosiy o‘qituvchi ustunlarida tez orientatsiya.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/students/manbalar"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "inline-flex h-10 shrink-0 items-center gap-2")}
          >
            <ChartColumnBig className="size-4" aria-hidden />
            Manbalar statistikasi
          </Link>
          <Link
            href="/students/new"
            className={cn(buttonVariants({ size: "lg" }), "inline-flex h-10 shrink-0 items-center gap-2")}
          >
            <UserPlus className="size-4" aria-hidden />
            Yangi o‘quvchi
          </Link>
        </div>
      </div>

      {students.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <p className="font-display text-lg font-medium">Hozircha o‘quvchilar yo‘q</p>
            <p className="mt-2 text-sm text-muted-foreground">Birinchi yozuvni qo‘shib boshlang.</p>
            <Link href="/students/new" className={cn(buttonVariants({ size: "lg" }), "mt-6 inline-flex")}>
              O‘quvchi qo‘shish
            </Link>
          </CardContent>
        </Card>
      ) : (
        <StudentsDataTable data={rows} />
      )}
    </div>
  );
}
