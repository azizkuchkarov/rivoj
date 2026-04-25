"use server";

import { redirect } from "next/navigation";

import { clearAuthSession, resolveRoleByCredentials, setAuthSession } from "@/lib/auth";

export type LoginActionState = {
  error?: string;
};

export async function loginAction(_prev: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const login = String(formData.get("login") ?? "");
  const password = String(formData.get("password") ?? "");

  const role = resolveRoleByCredentials(login, password);
  if (!role) {
    return { error: "Login yoki parol noto‘g‘ri." };
  }

  await setAuthSession(role);
  redirect("/");
}

export async function logoutAction() {
  await clearAuthSession();
  redirect("/login");
}
