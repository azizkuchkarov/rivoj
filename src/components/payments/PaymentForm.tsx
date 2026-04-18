"use client";

import { useActionState, useMemo, useState } from "react";

import { Loader2 } from "lucide-react";

import type { PaymentActionState } from "@/app/payments/actions";
import type { Student } from "@/generated/prisma/client";
import { PaymentKind, PaymentMethod } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";

type PaymentFormProps = {
  action: (state: PaymentActionState, formData: FormData) => Promise<PaymentActionState>;
  students: Pick<Student, "id" | "fullName" | "isActive">[];
  defaultStudentId?: string;
  /** lockStudent bo‘lsa ko‘rsatiladi */
  lockedStudentName?: string;
  /** true bo‘lsa o‘quvchi tanlash yashirin */
  lockStudent?: boolean;
  defaultKind?: PaymentKind;
  defaultPaidAt: string;
  submitLabel: string;
  redirectAfter?: "payments" | "student";
};

const METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: PaymentMethod.CASH, label: "Naqd pul" },
  { value: PaymentMethod.CARD, label: "Karta" },
  { value: PaymentMethod.TRANSFER, label: "Bank o‘tkazmasi" },
  { value: PaymentMethod.OTHER, label: "Boshqa" },
];

function fieldClass(err?: string) {
  return cn(
    "w-full rounded-2xl border bg-white/80 px-4 py-3 text-[var(--ink)] shadow-inner shadow-black/5 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-500/15",
    err ? "border-red-300 focus:border-red-400 focus:ring-red-200/40" : "border-zinc-200/90",
  );
}

export function PaymentForm({
  action,
  students,
  defaultStudentId = "",
  lockedStudentName,
  lockStudent = false,
  defaultKind = PaymentKind.DAILY,
  defaultPaidAt,
  submitLabel,
  redirectAfter = "payments",
}: PaymentFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const activeStudents = students.filter((s) => s.isActive);

  const [kind, setKind] = useState<PaymentKind>(defaultKind);
  const [subLessons, setSubLessons] = useState("");
  const [subPerLesson, setSubPerLesson] = useState("");

  const subscriptionTeacherTotal = useMemo(() => {
    const n = Number.parseInt(subLessons, 10);
    const p = Number.parseInt(subPerLesson, 10);
    if (!Number.isFinite(n) || !Number.isFinite(p) || n < 1 || p < 0) return null;
    return n * p;
  }, [subLessons, subPerLesson]);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="redirectAfter" value={redirectAfter} />

      {state.error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900"
        >
          {state.error}
        </div>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        {lockStudent ? (
          <div className="md:col-span-2 rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-sm text-violet-950">
            <span className="font-medium">O‘quvchi: </span>
            {lockedStudentName ?? "—"}
            <input type="hidden" name="studentId" value={defaultStudentId} />
          </div>
        ) : (
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="studentId">
              O‘quvchi <span className="text-red-500">*</span>
            </label>
            <select
              id="studentId"
              name="studentId"
              required
              defaultValue={defaultStudentId}
              className={fieldClass(state.fieldErrors?.studentId)}
            >
              <option value="" disabled>
                Tanlang
              </option>
              {activeStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
            {state.fieldErrors?.studentId ? (
              <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.studentId}</p>
            ) : null}
          </div>
        )}

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="kind">
            To‘lov turi <span className="text-red-500">*</span>
          </label>
          <select
            id="kind"
            name="kind"
            defaultValue={defaultKind}
            onChange={(e) => setKind(e.target.value as PaymentKind)}
            className={fieldClass(state.fieldErrors?.kind)}
          >
            <option value={PaymentKind.DAILY}>Kunlik to‘lov (o‘quvchi + o‘qituvchi ulushi)</option>
            <option value={PaymentKind.SUBSCRIPTION}>
              Abonentlik (jami summa, darslar soni, har bir dars uchun o‘qituvchi ulushi — jadvaldagi o‘qituvchiga)
            </option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="amountSom">
            {kind === PaymentKind.DAILY ? (
              <>O‘quvchi to‘lovi (so‘m) <span className="text-red-500">*</span></>
            ) : (
              <>Abonentlik jami (so‘m) <span className="text-red-500">*</span></>
            )}
          </label>
          <input
            id="amountSom"
            name="amountSom"
            type="number"
            required
            min={1000}
            step={1000}
            placeholder={kind === PaymentKind.DAILY ? "100000" : "1000000"}
            className={fieldClass(state.fieldErrors?.amountSom)}
          />
          {state.fieldErrors?.amountSom ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.amountSom}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="paidAt">
            To‘lov sanasi <span className="text-red-500">*</span>
          </label>
          <input
            id="paidAt"
            name="paidAt"
            type="date"
            required
            defaultValue={defaultPaidAt}
            className={fieldClass(state.fieldErrors?.paidAt)}
          />
          {state.fieldErrors?.paidAt ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.paidAt}</p>
          ) : null}
        </div>

        {kind === PaymentKind.DAILY ? (
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="teacherShareSom">
              Shu to‘lovdan o‘qituvchiga (so‘m) <span className="text-red-500">*</span>
            </label>
            <input
              id="teacherShareSom"
              name="teacherShareSom"
              type="number"
              required
              min={0}
              step={1000}
              placeholder="50000"
              className={fieldClass(state.fieldErrors?.teacherShareSom)}
            />
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              Masalan: bola 100 000 so‘m to‘lasa, o‘qituvchiga 50 000 so‘m yoziladi.
            </p>
            {state.fieldErrors?.teacherShareSom ? (
              <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.teacherShareSom}</p>
            ) : null}
          </div>
        ) : (
          <>
            <div>
              <label
                className="mb-2 block text-sm font-medium text-[var(--ink-soft)]"
                htmlFor="subscriptionLessonCount"
              >
                Nechta dars uchun <span className="text-red-500">*</span>
              </label>
              <input
                id="subscriptionLessonCount"
                name="subscriptionLessonCount"
                type="number"
                required
                min={1}
                max={2000}
                step={1}
                placeholder="12"
                value={subLessons}
                onChange={(e) => setSubLessons(e.target.value)}
                className={fieldClass(state.fieldErrors?.subscriptionLessonCount)}
              />
              {state.fieldErrors?.subscriptionLessonCount ? (
                <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.subscriptionLessonCount}</p>
              ) : null}
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-medium text-[var(--ink-soft)]"
                htmlFor="teacherSharePerLessonSom"
              >
                Har bir dars uchun o‘qituvchiga (so‘m) <span className="text-red-500">*</span>
              </label>
              <input
                id="teacherSharePerLessonSom"
                name="teacherSharePerLessonSom"
                type="number"
                required
                min={0}
                step={1000}
                placeholder="50000"
                value={subPerLesson}
                onChange={(e) => setSubPerLesson(e.target.value)}
                className={fieldClass(state.fieldErrors?.teacherSharePerLessonSom)}
              />
              {state.fieldErrors?.teacherSharePerLessonSom ? (
                <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.teacherSharePerLessonSom}</p>
              ) : null}
            </div>
            <div className="md:col-span-2 rounded-2xl border border-violet-100 bg-violet-50/50 px-4 py-3 text-sm text-violet-950">
              {subscriptionTeacherTotal != null ? (
                <p>
                  <span className="font-medium">O‘qituvchiga jami hisoblangan ulush:</span>{" "}
                  <span className="tabular-nums font-semibold">
                    {subscriptionTeacherTotal.toLocaleString("uz-UZ")} so‘m
                  </span>
                  <span className="text-violet-800/80">
                    {" "}
                    (darslar × dars narxi). Har bir darsda kelganda shu summa jadvaldagi o‘sha darsning o‘qituvchisiga
                    yoziladi.
                  </span>
                </p>
              ) : (
                <p className="text-[var(--muted)]">Darslar soni va dars narxini kiriting.</p>
              )}
            </div>
          </>
        )}

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="method">
            To‘lov usuli
          </label>
          <select id="method" name="method" defaultValue={PaymentMethod.CASH} className={fieldClass()}>
            {METHOD_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="description">
            Maqsad / izoh (qisqa)
          </label>
          <input
            id="description"
            name="description"
            className={fieldClass(state.fieldErrors?.description)}
            placeholder="Masalan: yanvar oyi, 12 dars paketi"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="notes">
            Qayd (ixtiyoriy)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className={fieldClass(state.fieldErrors?.notes)}
            placeholder="Ichki eslatma"
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-700 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/25 transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {submitLabel}
      </button>
    </form>
  );
}
