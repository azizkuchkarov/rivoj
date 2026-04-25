"use client";

import { useActionState } from "react";

import { Loader2 } from "lucide-react";

import { loginAction, type LoginActionState } from "@/app/login/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {} as LoginActionState);

  return (
    <form action={formAction} className="mx-auto w-full max-w-md space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--ink)]">Tizimga kirish</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Manager yoki admin login/parolini kiriting.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="login" className="text-sm font-medium text-[var(--ink-soft)]">
          Login
        </label>
        <input
          id="login"
          name="login"
          required
          autoComplete="username"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-[var(--ink-soft)]">
          Parol
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm"
        />
      </div>

      {state.error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Kirish
      </button>
    </form>
  );
}
