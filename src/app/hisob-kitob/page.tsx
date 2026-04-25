import Link from "next/link";

import { Calculator, ChevronLeft, ChevronRight } from "lucide-react";

import { AccountingTrendChart, type AccountingTrendPoint } from "@/components/accounting/AccountingTrendChart";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { LessonKind, PaymentKind } from "@/generated/prisma/enums";
import { formatSomUZS } from "@/lib/format-currency";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ month?: string }>;
};

function parseMonthParam(raw?: string) {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-").map(Number);
    if (y >= 2000 && m >= 1 && m <= 12) {
      return new Date(Date.UTC(y, m - 1, 1));
    }
  }
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function addMonthUtc(start: Date, delta: number) {
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + delta, 1));
}

function monthIso(start: Date) {
  const y = start.getUTCFullYear();
  const m = String(start.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(start: Date) {
  return new Intl.DateTimeFormat("uz-UZ", { month: "long", year: "numeric", timeZone: "UTC" }).format(start);
}

async function getMonthlyMetrics(start: Date, end: Date) {
  const [dailyLessonAgg, subscriptionAgg, teacherAgg, consultationRevAgg, consultationTeacherAgg] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        paidAt: { gte: start, lt: end },
        kind: PaymentKind.DAILY,
        lesson: { kind: LessonKind.LESSON },
      },
      _sum: { amountSom: true },
    }),
    prisma.payment.aggregate({
      where: {
        paidAt: { gte: start, lt: end },
        kind: PaymentKind.SUBSCRIPTION,
      },
      _sum: { amountSom: true },
    }),
    prisma.teacherLessonEarning.aggregate({
      where: { lesson: { lessonDate: { gte: start, lt: end } } },
      _sum: { amountSom: true },
    }),
    prisma.payment.aggregate({
      where: {
        paidAt: { gte: start, lt: end },
        kind: PaymentKind.DAILY,
        lesson: { kind: LessonKind.CONSULTATION },
      },
      _sum: { amountSom: true },
    }),
    prisma.teacherLessonEarning.aggregate({
      where: { lesson: { lessonDate: { gte: start, lt: end }, kind: LessonKind.CONSULTATION } },
      _sum: { amountSom: true },
    }),
  ]);

  const lessonRevenueSom = (dailyLessonAgg._sum.amountSom ?? 0) + (subscriptionAgg._sum.amountSom ?? 0);
  const salarySom = teacherAgg._sum.amountSom ?? 0;
  const consultationRevenueSom = consultationRevAgg._sum.amountSom ?? 0;
  const consultationSalarySom = consultationTeacherAgg._sum.amountSom ?? 0;
  const consultationProfitSom = consultationRevenueSom - consultationSalarySom;
  const revenueSom = lessonRevenueSom + consultationRevenueSom;
  const totalProfitSom = revenueSom - salarySom;

  return {
    lessonRevenueSom,
    salarySom,
    consultationRevenueSom,
    consultationSalarySom,
    consultationProfitSom,
    revenueSom,
    totalProfitSom,
  };
}

export default async function HisobKitobPage({ searchParams }: PageProps) {
  const { month } = await searchParams;
  const monthStart = parseMonthParam(month);
  const monthEnd = addMonthUtc(monthStart, 1);
  const monthParam = monthIso(monthStart);
  const prevMonth = monthIso(addMonthUtc(monthStart, -1));
  const nextMonth = monthIso(addMonthUtc(monthStart, 1));

  let lessonRevenueSom = 0;
  let teacherSalarySom = 0;
  let consultationRevenueSom = 0;
  let consultationTeacherSom = 0;
  let consultationProfitSom = 0;
  let totalRevenueSom = 0;
  let totalProfitSom = 0;
  let trendData: AccountingTrendPoint[] = [];

  try {
    const current = await getMonthlyMetrics(monthStart, monthEnd);
    lessonRevenueSom = current.lessonRevenueSom;
    teacherSalarySom = current.salarySom;
    consultationRevenueSom = current.consultationRevenueSom;
    consultationTeacherSom = current.consultationSalarySom;
    consultationProfitSom = current.consultationProfitSom;
    totalRevenueSom = current.revenueSom;
    totalProfitSom = current.totalProfitSom;

    const starts = Array.from({ length: 6 }, (_, i) => addMonthUtc(monthStart, i - 5));
    const trendMetrics = await Promise.all(starts.map((s) => getMonthlyMetrics(s, addMonthUtc(s, 1))));
    trendData = starts.map((s, idx) => ({
      month: monthIso(s),
      label: new Intl.DateTimeFormat("uz-UZ", { month: "short", year: "2-digit", timeZone: "UTC" }).format(s),
      revenueSom: trendMetrics[idx]!.revenueSom,
      salarySom: trendMetrics[idx]!.salarySom,
      consultationProfitSom: trendMetrics[idx]!.consultationProfitSom,
      totalProfitSom: trendMetrics[idx]!.totalProfitSom,
    }));
  } catch {
    return <DbUnavailable />;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-900 ring-1 ring-indigo-200">
              <Calculator className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-indigo-950 md:text-2xl">Xisob kitob</h1>
              <p className="mt-1 text-sm text-indigo-900">Oy bo‘yicha tushum, oylik va foyda ko‘rsatkichlari.</p>
            </div>
          </div>
          <form action="/hisob-kitob" className="flex items-center gap-2">
            <Link
              href={`/hisob-kitob?month=${prevMonth}`}
              className="inline-flex items-center rounded-full border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-100"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Link>
            <input
              type="month"
              name="month"
              defaultValue={monthParam}
              className="rounded-full border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-900 outline-none"
            />
            <button
              type="submit"
              className="rounded-full border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-100"
            >
              Filtrlash
            </button>
            <Link
              href={`/hisob-kitob?month=${nextMonth}`}
              className="inline-flex items-center rounded-full border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-100"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </form>
        </div>
        <p className="mt-3 text-sm font-medium text-indigo-900">Tanlangan oy: {monthLabel(monthStart)}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Umumiy darslardan kelgan summa</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-emerald-950">{formatSomUZS(lessonRevenueSom)} so‘m</p>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Umumiy o‘qituvchilar oyligi</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-amber-950">{formatSomUZS(teacherSalarySom)} so‘m</p>
        </article>

        <article className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-900">Konsultatsiyadan kelgan foyda</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-violet-950">{formatSomUZS(consultationProfitSom)} so‘m</p>
          <p className="mt-1 text-xs text-violet-900">
            Tushum: {formatSomUZS(consultationRevenueSom)} · Oylik: {formatSomUZS(consultationTeacherSom)}
          </p>
        </article>

        <article className="rounded-2xl border border-indigo-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-900">Umumiy foyda</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-indigo-950">{formatSomUZS(totalProfitSom)} so‘m</p>
          <p className="mt-1 text-xs text-indigo-900">Jami tushum: {formatSomUZS(totalRevenueSom)}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <AccountingTrendChart data={trendData} />
        </div>
        <div className="space-y-4 xl:col-span-2">
          <article className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700">Konsultatsiya tushumi</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-[var(--ink)]">
              {formatSomUZS(consultationRevenueSom)} so‘m
            </p>
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700">Konsultatsiya oyligi</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-[var(--ink)]">
              {formatSomUZS(consultationTeacherSom)} so‘m
            </p>
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700">Qisqa formula</p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Umumiy foyda = (Darslar + Konsultatsiya tushumi) - O‘qituvchilar oyligi
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
