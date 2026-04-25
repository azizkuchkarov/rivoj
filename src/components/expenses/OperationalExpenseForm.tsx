"use client";

import { useActionState } from "react";

import { Loader2 } from "lucide-react";

import type { OperationalExpenseActionState } from "@/app/expenses/actions";
import { cn } from "@/lib/cn";

type OperationalExpenseFormProps = {
  action: (
    state: OperationalExpenseActionState,
    formData: FormData,
  ) => Promise<OperationalExpenseActionState>;
  defaultSpentAt: string;
};

function fieldClass(err?: string) {
  return cn(
    "w-full rounded-2xl border bg-white/80 px-4 py-3 text-[var(--ink)] shadow-inner shadow-black/5 outline-none transition placeholder:text-zinc-400 focus:border-amber-300 focus:ring-4 focus:ring-amber-500/15",
    err ? "border-red-300 focus:border-red-400 focus:ring-red-200/40" : "border-zinc-200/90",
  );
}

export function OperationalExpenseForm({ action, defaultSpentAt }: OperationalExpenseFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="exp-title">
            Xarajat nomi <span className="text-red-500">*</span>
          </label>
          <input
            id="exp-title"
            name="title"
            required
            className={fieldClass(state.fieldErrors?.title)}
            placeholder="Masalan: kanstovar, printer qog‘ozi"
          />
          {state.fieldErrors?.title ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.title}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="exp-category">
            Kategoriya
          </label>
          <input
            id="exp-category"
            name="category"
            className={fieldClass(state.fieldErrors?.category)}
            placeholder="Masalan: ofis, transport, xizmat"
          />
          {state.fieldErrors?.category ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.category}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="exp-amount">
            Summa (so‘m) <span className="text-red-500">*</span>
          </label>
          <input
            id="exp-amount"
            name="amountSom"
            type="number"
            min={1}
            step={1000}
            required
            onWheel={(e) => e.currentTarget.blur()}
            className={fieldClass(state.fieldErrors?.amountSom)}
            placeholder="50000"
          />
          {state.fieldErrors?.amountSom ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.amountSom}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="exp-date">
            Xarajat sanasi <span className="text-red-500">*</span>
          </label>
          <input
            id="exp-date"
            name="spentAt"
            type="date"
            required
            defaultValue={defaultSpentAt}
            className={fieldClass(state.fieldErrors?.spentAt)}
          />
          {state.fieldErrors?.spentAt ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.spentAt}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="exp-notes">
            Izoh
          </label>
          <textarea
            id="exp-notes"
            name="notes"
            rows={3}
            className={fieldClass(state.fieldErrors?.notes)}
            placeholder="Qisqacha: nima uchun, qayerdan olingan…"
          />
          {state.fieldErrors?.notes ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.notes}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-900/20 transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Xarajatni saqlash
        </button>
      </div>
    </form>
  );
}
