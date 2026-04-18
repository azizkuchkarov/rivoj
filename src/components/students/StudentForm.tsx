"use client";

import { useActionState } from "react";

import { Loader2 } from "lucide-react";

import type { StudentActionState } from "@/app/students/actions";
import type { Student, Teacher } from "@/generated/prisma/client";
import { cn } from "@/lib/cn";
import { STUDENT_GENDER_OPTIONS } from "@/lib/student-gender";

type StudentFormProps = {
  action: (state: StudentActionState, formData: FormData) => Promise<StudentActionState>;
  teachers: Pick<Teacher, "id" | "fullName" | "isActive" | "listNumber">[];
  defaultValues?: Partial<
    Pick<
      Student,
      | "fullName"
      | "dateOfBirth"
      | "gender"
      | "guardianName"
      | "guardianPhone"
      | "notes"
      | "focusAreas"
      | "primaryTeacherId"
      | "isActive"
    >
  >;
  submitLabel: string;
};

function fieldClass(err?: string) {
  return cn(
    "w-full rounded-2xl border bg-white/80 px-4 py-3 text-[var(--ink)] shadow-inner shadow-black/5 outline-none transition placeholder:text-zinc-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/15",
    err ? "border-red-300 focus:border-red-400 focus:ring-red-200/40" : "border-zinc-200/90",
  );
}

function formatDateInput(d: Date | null | undefined) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function isLegacyGender(g: string | null | undefined) {
  if (!g) return false;
  return g !== "male" && g !== "female";
}

export function StudentForm({ action, teachers, defaultValues, submitLabel }: StudentFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  const dv = defaultValues ?? {};
  const focusText = Array.isArray(dv.focusAreas) ? dv.focusAreas.join(", ") : "";
  const legacyGender = typeof dv.gender === "string" && isLegacyGender(dv.gender) ? dv.gender : null;

  return (
    <form action={formAction} className="space-y-8">
      {state.error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900"
        >
          {state.error}
        </div>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="fullName">
            Bola ismi <span className="text-red-500">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            required
            defaultValue={dv.fullName ?? ""}
            className={fieldClass(state.fieldErrors?.fullName)}
            placeholder="Masalan: Amir Karimov"
            autoComplete="name"
          />
          {state.fieldErrors?.fullName ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.fullName}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="dateOfBirth">
            Tug‘ilgan sana
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            defaultValue={formatDateInput(dv.dateOfBirth)}
            className={fieldClass(state.fieldErrors?.dateOfBirth)}
          />
          {state.fieldErrors?.dateOfBirth ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.dateOfBirth}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="gender">
            Jins
          </label>
          <select
            id="gender"
            name="gender"
            defaultValue={
              legacyGender
                ? legacyGender
                : dv.gender === "male" || dv.gender === "female"
                  ? dv.gender
                  : ""
            }
            className={fieldClass(state.fieldErrors?.gender)}
          >
            {STUDENT_GENDER_OPTIONS.map((o) => (
              <option key={o.value === "" ? "_empty" : o.value} value={o.value}>
                {o.label}
              </option>
            ))}
            {legacyGender ? (
              <option value={legacyGender}>{legacyGender} (avvalgi yozuv)</option>
            ) : null}
          </select>
          {state.fieldErrors?.gender ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.gender}</p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="primaryTeacherId">
            Asosiy o‘qituvchi
          </label>
          <select
            id="primaryTeacherId"
            name="primaryTeacherId"
            defaultValue={dv.primaryTeacherId ?? ""}
            className={fieldClass(state.fieldErrors?.primaryTeacherId)}
          >
            <option value="">Tanlanmagan</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                №{t.listNumber} — {t.fullName}
                {!t.isActive ? " (nofaol)" : ""}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-[var(--muted)]">
            Keyinroq avtomatik taqsimot uchun ham ishlatiladi.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="guardianName">
            Ota-ona / vasiy
          </label>
          <input
            id="guardianName"
            name="guardianName"
            defaultValue={dv.guardianName ?? ""}
            className={fieldClass(state.fieldErrors?.guardianName)}
            placeholder="F.I.O."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="guardianPhone">
            Vasiy telefoni
          </label>
          <input
            id="guardianPhone"
            name="guardianPhone"
            defaultValue={dv.guardianPhone ?? ""}
            className={fieldClass(state.fieldErrors?.guardianPhone)}
            placeholder="+998 …"
            autoComplete="tel"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="focusAreas">
            Mashg‘ulot / ehtiyoj yo‘nalishlari
          </label>
          <textarea
            id="focusAreas"
            name="focusAreas"
            rows={3}
            defaultValue={focusText}
            className={fieldClass(state.fieldErrors?.focusAreas)}
            placeholder="Artikulyatsiya, nutq… — vergul bilan ajrating"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="notes">
            Izoh
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={dv.notes ?? ""}
            className={fieldClass(state.fieldErrors?.notes)}
            placeholder="Qisqa eslatmalar, tibbiy cheklovlar (maxfiy saqlanadi)…"
          />
        </div>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            defaultChecked={dv.isActive !== false}
            value="true"
            className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-[var(--ink-soft)]">
            O‘quvchi faol (jadval va qabulda ko‘rinadi)
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-700 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
