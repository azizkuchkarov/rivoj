"use client";

import Link from "next/link";

import { CalendarDays, UserPlus } from "lucide-react";

import { TeacherCard } from "@/components/teachers/TeacherCard";
import { TeachersDataTable } from "@/components/teachers/TeachersDataTable";
import type { TeacherRow } from "@/components/teachers/teachers-columns";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import type { Teacher } from "@/generated/prisma/client";

type TeacherWithCounts = Teacher & {
  _count: { students: number; lessons: number };
};

type Holat = "all" | "faol" | "nofaol";

export function TeachersPageView({
  teachers,
  tableRows,
  holatFilter,
  stats,
  emptyByFilter,
}: {
  teachers: TeacherWithCounts[];
  tableRows: TeacherRow[];
  holatFilter: Holat;
  stats: {
    totalTeachers: number;
    activeTeachers: number;
    inactiveTeachers: number;
    studentsWithPrimary: number;
  };
  emptyByFilter: boolean;
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Jamoa</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">O‘qituvchilar</h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-[15px] md:leading-relaxed">
            Kartochka yoki jadval ko‘rinishi — filtrlar serverda saqlanadi.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/schedule"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 gap-2")}
          >
            <CalendarDays className="size-4" aria-hidden />
            Dars jadvali
          </Link>
          <Link href="/teachers/new" className={cn(buttonVariants({ size: "lg" }), "h-10 gap-2")}>
            <UserPlus className="size-4" aria-hidden />
            Yangi o‘qituvchi
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Jami</p>
            <p className="font-display mt-1 text-2xl font-semibold tabular-nums">{stats.totalTeachers}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Faol</p>
            <p className="font-display mt-1 text-2xl font-semibold tabular-nums text-emerald-700">
              {stats.activeTeachers}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nofaol</p>
            <p className="font-display mt-1 text-2xl font-semibold tabular-nums">{stats.inactiveTeachers}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm sm:col-span-2 xl:col-span-1">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Asosiy o‘qituvchisi bor</p>
            <p className="font-display mt-1 text-2xl font-semibold tabular-nums">{stats.studentsWithPrimary}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <HolatFilter current={holatFilter} />
          <p className="text-sm text-muted-foreground">
            {holatFilter === "all"
              ? `Ko‘rsatilmoqda: ${teachers.length} ta`
              : `${holatFilter === "faol" ? "Faqat faol" : "Faqat nofaol"} · ${teachers.length} ta`}
          </p>
        </CardContent>
      </Card>

      {emptyByFilter ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center">
            <p className="font-medium">Bu filtr bo‘yicha natija yo‘q</p>
            <Link href="/teachers" className={cn(buttonVariants({ className: "mt-4" }))}>
              Barcha o‘qituvchilar
            </Link>
          </CardContent>
        </Card>
      ) : teachers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <p className="font-display text-lg font-medium">Hozircha o‘qituvchilar yo‘q</p>
            <p className="mt-2 text-sm text-muted-foreground">Birinchi profilni yarating.</p>
            <Link href="/teachers/new" className={cn(buttonVariants({ size: "lg" }), "mt-6 inline-flex")}>
              Profil qo‘shish
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="cards">Kartochkalar</TabsTrigger>
            <TabsTrigger value="table">Jadval</TabsTrigger>
          </TabsList>
          <TabsContent value="cards" className="mt-6">
            <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {teachers.map((t) => (
                <li key={t.id}>
                  <TeacherCard teacher={t} />
                </li>
              ))}
            </ul>
          </TabsContent>
          <TabsContent value="table" className="mt-6">
            <TeachersDataTable data={tableRows} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function HolatFilter({ current }: { current: Holat }) {
  const base = cn(
    buttonVariants({ variant: "outline", size: "sm" }),
    "rounded-full border-border/80",
  );
  const active = cn(buttonVariants({ size: "sm" }), "rounded-full");
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/teachers" className={current === "all" ? active : base}>
        Barchasi
      </Link>
      <Link href="/teachers?holat=faol" className={current === "faol" ? active : base}>
        Faol
      </Link>
      <Link href="/teachers?holat=nofaol" className={current === "nofaol" ? active : base}>
        Nofaol
      </Link>
    </div>
  );
}
