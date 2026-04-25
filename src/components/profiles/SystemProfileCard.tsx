"use client";

import { useActionState } from "react";

import { Loader2 } from "lucide-react";

import { saveSystemProfile, type SaveSystemProfileState } from "@/app/profiles/actions";
import { SystemProfileRole } from "@/generated/prisma/enums";

type SystemProfileCardProps = {
  role: SystemProfileRole;
  title: string;
  description: string;
  defaultValues?: {
    fullName: string;
    telegramChatId: string | null;
    isActive: boolean;
  };
};

export function SystemProfileCard({ role, title, description, defaultValues }: SystemProfileCardProps) {
  const [state, formAction, pending] = useActionState(saveSystemProfile, {} as SaveSystemProfileState);
  const dv = defaultValues ?? { fullName: "", telegramChatId: null, isActive: true };

  return (
    <form action={formAction} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <input type="hidden" name="role" value={role} />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
        <p className="text-sm text-[var(--muted)]">{description}</p>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--ink-soft)]" htmlFor={`${role}-name`}>
            Ism
          </label>
          <input
            id={`${role}-name`}
            name="fullName"
            defaultValue={dv.fullName}
            required
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--ink-soft)]" htmlFor={`${role}-chat`}>
            Telegram chat ID
          </label>
          <input
            id={`${role}-chat`}
            name="telegramChatId"
            defaultValue={dv.telegramChatId ?? ""}
            placeholder="123456789"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
          <input type="checkbox" name="isActive" value="true" defaultChecked={dv.isActive} className="h-4 w-4" />
          Faol (xabar yuboriladi)
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Saqlash
        </button>
        {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-xs text-emerald-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
