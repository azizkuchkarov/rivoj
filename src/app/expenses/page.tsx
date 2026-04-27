import { Receipt } from "lucide-react";

import { createOperationalExpense, deleteOperationalExpense } from "@/app/expenses/actions";
import { DeleteConfirmForm } from "@/components/common/DeleteConfirmForm";
import { OperationalExpenseForm } from "@/components/expenses/OperationalExpenseForm";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { prisma } from "@/lib/prisma";
import { formatSomUZS } from "@/lib/format-currency";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  let expenses;
  let totalSom = 0;
  try {
    const [list, agg] = await Promise.all([
      prisma.operationalExpense.findMany({
        orderBy: [{ spentAt: "desc" }, { createdAt: "desc" }],
      }),
      prisma.operationalExpense.aggregate({ _sum: { amountSom: true } }),
    ]);
    expenses = list;
    totalSom = agg._sum.amountSom ?? 0;
  } catch {
    return <DbUnavailable />;
  }

  const defaultSpentAt = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-900 ring-1 ring-amber-100">
          <Receipt className="h-3.5 w-3.5" aria-hidden />
          Markaz
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
          Qo‘shimcha xarajat
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-black">
          Ish vaqtida chiqqan xarajatlar: summani, sanani va qisqa nomni kiriting. Ro‘yxat pastda jamlanadi.
        </p>
      </header>

      <div className="rounded-2xl border border-amber-100/90 bg-gradient-to-br from-amber-50/50 to-white px-5 py-4 ring-1 ring-amber-100/70">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">Barcha vaqt bo‘yicha jami</p>
        <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-amber-950">
          {formatSomUZS(totalSom)} <span className="text-lg font-medium text-amber-900/80">so‘m</span>
        </p>
        <p className="mt-1 text-xs text-amber-900/70">{expenses.length} ta yozuv</p>
      </div>

      <section className="rounded-[2rem] border border-white/70 bg-[color:var(--surface)] p-6 shadow-xl shadow-black/5 md:p-10">
        <h2 className="font-display text-lg font-semibold text-[var(--ink)]">Yangi xarajat</h2>
        <p className="mt-1 text-sm text-black">Har bir xarajat alohida qator sifatida saqlanadi.</p>
        <div className="mt-6">
          <OperationalExpenseForm action={createOperationalExpense} defaultSpentAt={defaultSpentAt} />
        </div>
      </section>

      {expenses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-amber-200/90 bg-white/50 px-8 py-16 text-center">
          <p className="font-display text-lg font-medium text-[var(--ink)]">Hozircha xarajat yozuvlari yo‘q</p>
          <p className="mt-2 text-sm text-black">Yuqoridagi forma orqali birinchi yozuvni qo‘shing.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/70 bg-[color:var(--surface)] shadow-lg shadow-black/5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-amber-50/85">
                <th className="px-4 py-3 font-semibold text-zinc-700">Sana</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Nom</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Kategoriya</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Summa</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Izoh</th>
                <th className="w-[72px] px-2 py-3"> </th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => {
                const d = new Intl.DateTimeFormat("uz-UZ", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(e.spentAt);
                return (
                  <tr key={e.id} className="border-b border-zinc-100/90 odd:bg-white/50">
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--ink-soft)]">{d}</td>
                    <td className="px-4 py-3 font-medium text-[var(--ink)]">{e.title}</td>
                    <td className="px-4 py-3 text-black">{e.category ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-[var(--ink)]">
                      {formatSomUZS(e.amountSom)} so‘m
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-3 text-black" title={e.notes ?? ""}>
                      {e.notes ?? "—"}
                    </td>
                    <td className="px-1 py-2">
                      <DeleteConfirmForm
                        action={deleteOperationalExpense}
                        id={e.id}
                        displayName={`${e.title} · ${formatSomUZS(e.amountSom)} so‘m`}
                        entityLabel="Xarajatni"
                        compact
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
