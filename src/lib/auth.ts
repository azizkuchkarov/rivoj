import { cookies } from "next/headers";

export type UserRole = "manager" | "admin";

const SESSION_COOKIE_NAME = "rivoj_session_role";

function normalize(s: string | undefined): string {
  return (s ?? "").trim();
}

export function resolveRoleByCredentials(login: string, password: string): UserRole | null {
  const l = normalize(login);
  const p = normalize(password);
  const managerLogin = normalize(process.env.MANAGER_LOGIN);
  const managerPassword = normalize(process.env.MANAGER_PASSWORD);
  const adminLogin = normalize(process.env.ADMIN_LOGIN);
  const adminPassword = normalize(process.env.ADMIN_PASSWORD);

  if (managerLogin && managerPassword && l === managerLogin && p === managerPassword) {
    return "manager";
  }
  if (adminLogin && adminPassword && l === adminLogin && p === adminPassword) {
    return "admin";
  }
  return null;
}

export async function getCurrentRole(): Promise<UserRole | null> {
  const jar = await cookies();
  const role = jar.get(SESSION_COOKIE_NAME)?.value;
  return role === "manager" || role === "admin" ? role : null;
}

export async function setAuthSession(role: UserRole) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE_NAME);
}
