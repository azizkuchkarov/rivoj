"use client";

import { useActionState } from "react";

import { Loader2, Send } from "lucide-react";

import {
  sendTeacherTelegramTest,
  type TeacherTelegramTestActionState,
} from "@/app/teachers/actions";

export function TeacherTelegramTestButton({ teacherId }: { teacherId: string }) {
  const [state, formAction, pending] = useActionState(sendTeacherTelegramTest, {} as TeacherTelegramTestActionState);

  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="teacherId" value={teacherId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-indigo-200 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-900 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
        Telegram test
      </button>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-emerald-700">{state.success}</p> : null}
    </form>
  );
}

