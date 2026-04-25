import { redirect } from "next/navigation";

import { LoginForm } from "@/app/login/LoginForm";
import { getCurrentRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const role = await getCurrentRole();
  if (role) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <LoginForm />
    </div>
  );
}
