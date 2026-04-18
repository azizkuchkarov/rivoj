"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { operationalExpenseFormSchema } from "@/lib/validations/operational-expense";

export type OperationalExpenseActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function formDataToObject(formData: FormData) {
  return {
    amountSom: String(formData.get("amountSom") ?? ""),
    spentAt: String(formData.get("spentAt") ?? ""),
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

export async function createOperationalExpense(
  _prev: OperationalExpenseActionState,
  formData: FormData,
): Promise<OperationalExpenseActionState> {
  const parsed = operationalExpenseFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  try {
    await prisma.operationalExpense.create({
      data: {
        amountSom: data.amountSom,
        spentAt: new Date(`${data.spentAt}T12:00:00.000Z`),
        title: data.title,
        category: data.category,
        notes: data.notes,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Saqlashda xatolik";
    return { error: msg };
  }

  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function deleteOperationalExpense(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/expenses");
  try {
    await prisma.operationalExpense.delete({ where: { id } });
  } catch {
    redirect("/expenses");
  }
  revalidatePath("/expenses");
  redirect("/expenses");
}
