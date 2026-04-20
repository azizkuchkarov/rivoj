"use client";

import { useActionState } from "react";

import { Loader2 } from "lucide-react";

import type { TeacherActionState } from "@/app/teachers/actions";
import type { Teacher } from "@/generated/prisma/client";
import { cn } from "@/lib/cn";

type TeacherFormProps = {
  action: (state: TeacherActionState, formData: FormData) => Promise<TeacherActionState>;
  /** Yangi o‘qituvchi uchun tavsiya etilgan keyingi № */
  suggestedListNumber?: number;
  defaultValues?: Partial<
    Pick<
      Teacher,
      | "listNumber"
      | "fullName"
      | "title"
      | "phone"
      | "telegramChatId"
      | "photoUrl"
      | "specialties"
      | "experienceYears"
      | "isActive"
      | "offersConsultation"
    >
  >;
  submitLabel: string;
};

function fieldClass(err?: string) {
  return cn(
    "w-full rounded-2xl border bg-white/80 px-4 py-3 text-[var(--ink)] shadow-inner shadow-black/5 outline-none transition placeholder:text-zinc-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-500/15",
    err ? "border-red-300 focus:border-red-400 focus:ring-red-200/40" : "border-zinc-200/90",
  );
}

export function TeacherForm({ action, suggestedListNumber, defaultValues, submitLabel }: TeacherFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  const dv = defaultValues ?? {};
  const specialtiesText = Array.isArray(dv.specialties) ? dv.specialties.join(", ") : "";
  const listNumberDefault =
    typeof dv.listNumber === "number" && dv.listNumber > 0
      ? dv.listNumber
      : (suggestedListNumber ?? 1);

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
        <div className="md:col-span-1">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="listNumber">
            Tartib raqami (№) <span className="text-red-500">*</span>
          </label>
          <input
            id="listNumber"
            name="listNumber"
            type="number"
            required
            min={1}
            max={999}
            defaultValue={listNumberDefault}
            className={fieldClass(state.fieldErrors?.listNumber)}
          />
          <p className="mt-1.5 text-xs text-[var(--muted)]">
            Ro‘yxat va jadvalda shu raqam bo‘yicha tartiblanadi. № ni o‘zgartirsangiz, oralig‘dagi boshqa
            o‘qituvchilar avtomatik siljiydi (masalan, 7 → 1: 1–6 lar ketma-ket 2–7 ga o‘tadi).
          </p>
          {state.fieldErrors?.listNumber ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.listNumber}</p>
          ) : null}
        </div>

        <div className="md:col-span-1">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="fullName">
            To‘liq ism <span className="text-red-500">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            required
            defaultValue={dv.fullName ?? ""}
            className={fieldClass(state.fieldErrors?.fullName)}
            placeholder="Masalan: Nilufar Karimova"
            autoComplete="name"
          />
          {state.fieldErrors?.fullName ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.fullName}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="title">
            Lavozim / unvon
          </label>
          <input
            id="title"
            name="title"
            defaultValue={dv.title ?? ""}
            className={fieldClass(state.fieldErrors?.title)}
            placeholder="Masalan: katta logoped"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="experienceYears">
            Tajriba (yil)
          </label>
          <input
            id="experienceYears"
            name="experienceYears"
            type="number"
            min={0}
            max={80}
            defaultValue={dv.experienceYears ?? ""}
            className={fieldClass(state.fieldErrors?.experienceYears)}
            placeholder="8"
          />
          {state.fieldErrors?.experienceYears ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.experienceYears}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="phone">
            Telefon
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={dv.phone ?? ""}
            className={fieldClass(state.fieldErrors?.phone)}
            placeholder="+998 …"
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="telegramChatId">
            Telegram chat ID
          </label>
          <input
            id="telegramChatId"
            name="telegramChatId"
            defaultValue={dv.telegramChatId ?? ""}
            className={fieldClass(state.fieldErrors?.telegramChatId)}
            placeholder="123456789"
          />
          <p className="mt-1.5 text-xs text-[var(--muted)]">
            O‘qituvchi botga /start berganidan keyin chiqqan chat/user ID ni kiriting.
          </p>
          {state.fieldErrors?.telegramChatId ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.telegramChatId}</p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="photoUrl">
            Rasm URL
          </label>
          <input
            id="photoUrl"
            name="photoUrl"
            type="url"
            defaultValue={dv.photoUrl ?? ""}
            className={fieldClass(state.fieldErrors?.photoUrl)}
            placeholder="https://…"
          />
          {state.fieldErrors?.photoUrl ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.photoUrl}</p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="specialties">
            Mutaxassisliklar
          </label>
          <textarea
            id="specialties"
            name="specialties"
            rows={3}
            defaultValue={specialtiesText}
            className={fieldClass(state.fieldErrors?.specialties)}
            placeholder="Artikulyatsiya, dislaliya, alaliya — vergul yoki yangi qator bilan ajrating"
          />
          {state.fieldErrors?.specialties ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.specialties}</p>
          ) : null}
        </div>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            defaultChecked={dv.isActive !== false}
            value="true"
            className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-[var(--ink-soft)]">
            O‘qituvchi faol (yangi bolalar biriktiriladi)
          </label>
        </div>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3">
          <input
            id="offersConsultation"
            name="offersConsultation"
            type="checkbox"
            defaultChecked={dv.offersConsultation === true}
            value="true"
            className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
          />
          <label htmlFor="offersConsultation" className="text-sm font-medium text-[var(--ink-soft)]">
            Konsultatsiya olib boradi (konsultatsiya jadvalida ko‘rinadi)
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
