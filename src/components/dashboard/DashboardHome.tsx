import Link from "next/link";

import { ArrowRight, CalendarDays, Users, UsersRound, Wallet } from "lucide-react";

import { DashboardCharts, type MonthlyPoint } from "@/components/dashboard/DashboardCharts";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardHomeProps = {
  teacherActive: number;
  teacherTotal: number;
  studentActive: number;
  studentTotal: number;
  paymentMonthSom: number;
  chartData: MonthlyPoint[];
};

export function DashboardHome({
  teacherActive,
  teacherTotal,
  studentActive,
  studentTotal,
  paymentMonthSom,
  chartData,
}: DashboardHomeProps) {
  const money = new Intl.NumberFormat("uz-UZ").format(paymentMonthSom);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Rivoj</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Bosh sahifa
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-[15px] md:leading-relaxed">
          Markaz bo‘yicha tezkor ko‘rsatkichlar: jamoa, o‘quvchilar va joriy oy to‘lovlari.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">O‘qituvchilar</CardTitle>
            <Users className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">{teacherActive}</p>
            <p className="text-xs text-muted-foreground">faol · jami {teacherTotal}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">O‘quvchilar</CardTitle>
            <UsersRound className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">{studentActive}</p>
            <p className="text-xs text-muted-foreground">faol · jami {studentTotal}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm sm:col-span-2 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Joriy oy to‘lovlari</CardTitle>
            <Wallet className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">{money}</p>
            <p className="text-xs text-muted-foreground">so‘m (shu kalendar oyida)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <DashboardCharts data={chartData} />
        </div>
        <Card className="h-fit border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">Tezkor havolalar</CardTitle>
            <CardDescription>Eng ko‘p ishlatiladigan bo‘limlar</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link
              href="/schedule"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-10 w-full justify-between px-3 font-medium",
              )}
            >
              <span className="flex items-center gap-2">
                <CalendarDays className="size-4" aria-hidden />
                Dars jadvali
              </span>
              <ArrowRight className="size-4 opacity-60" aria-hidden />
            </Link>
            <Link
              href="/students"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-10 w-full justify-between px-3 font-medium",
              )}
            >
              <span className="flex items-center gap-2">
                <UsersRound className="size-4" aria-hidden />
                O‘quvchilar
              </span>
              <ArrowRight className="size-4 opacity-60" aria-hidden />
            </Link>
            <Link
              href="/payments"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-10 w-full justify-between px-3 font-medium",
              )}
            >
              <span className="flex items-center gap-2">
                <Wallet className="size-4" aria-hidden />
                To‘lovlar
              </span>
              <ArrowRight className="size-4 opacity-60" aria-hidden />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
