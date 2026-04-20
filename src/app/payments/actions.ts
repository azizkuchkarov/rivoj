"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { paymentFormSchema } from "@/lib/validations/payment";
import { PaymentKind } from "@/generated/prisma/enums";

export type PaymentActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function formDataToObject(formData: FormData) {
  return {
    studentId: String(formData.get("studentId") ?? ""),
    teacherId: String(formData.get("teacherId") ?? ""),
    kind: String(formData.get("kind") ?? PaymentKind.DAILY),
    amountSom: String(formData.get("amountSom") ?? ""),
    paidAt: String(formData.get("paidAt") ?? ""),
    method: String(formData.get("method") ?? "CASH"),
    description: String(formData.get("description") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    teacherShareSom: String(formData.get("teacherShareSom") ?? ""),
    subscriptionLessonCount: String(formData.get("subscriptionLessonCount") ?? ""),
    teacherSharePerLessonSom: String(formData.get("teacherSharePerLessonSom") ?? ""),
    redirectAfter: String(formData.get("redirectAfter") ?? "payments"),
  };
}

export async function createPayment(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const parsed = paymentFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;
  const student = await prisma.student.findFirst({ where: { id: data.studentId } });
  if (!student) {
    return { error: "O‘quvchi topilmadi." };
  }
  if (data.kind === PaymentKind.DAILY) {
    const teacher = await prisma.teacher.findFirst({
      where: { id: data.teacherId, isActive: true },
      select: { id: true },
    });
    if (!teacher) {
      return { error: "Tanlangan o‘qituvchi topilmadi yoki faol emas." };
    }
  }

  let teacherShareSom: number | null = null;
  let subscriptionLessonCount: number | null = null;
  let teacherSharePerLessonSom: number | null = null;
  let subscriptionLessonsRemaining: number | null = null;

  if (data.kind === PaymentKind.DAILY) {
    teacherShareSom = data.teacherShareSom ?? 0;
  } else {
    subscriptionLessonCount = data.subscriptionLessonCount!;
    teacherSharePerLessonSom = data.teacherSharePerLessonSom!;
    teacherShareSom = subscriptionLessonCount * teacherSharePerLessonSom;
    subscriptionLessonsRemaining = subscriptionLessonCount;
  }

  try {
    await prisma.payment.create({
      data: {
        studentId: data.studentId,
        kind: data.kind,
        amountSom: data.amountSom,
        paidAt: new Date(`${data.paidAt}T12:00:00.000Z`),
        method: data.method,
        description: data.description,
        notes: data.notes,
        teacherId: data.kind === PaymentKind.DAILY ? data.teacherId! : null,
        teacherShareSom,
        subscriptionLessonCount,
        teacherSharePerLessonSom,
        subscriptionLessonsRemaining,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Saqlashda xatolik";
    return { error: msg };
  }

  revalidatePath("/payments");
  revalidatePath(`/students/${data.studentId}`);

  if (data.redirectAfter === "student") {
    redirect(`/students/${data.studentId}`);
  }
  redirect(`/payments${data.studentId ? `?studentId=${encodeURIComponent(data.studentId)}` : ""}`);
}

export async function deletePayment(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const backToStudent = String(formData.get("redirectToStudent") ?? "") === "1";
  if (!id) redirect("/payments");

  let studentId: string | null = null;
  let teacherId: string | null = null;
  try {
    const existing = await prisma.payment.findUnique({
      where: { id },
      select: { studentId: true, teacherId: true },
    });
    studentId = existing?.studentId ?? null;
    teacherId = existing?.teacherId ?? null;
    await prisma.payment.delete({ where: { id } });
  } catch {
    redirect("/payments");
  }

  revalidatePath("/payments");
  if (studentId) revalidatePath(`/students/${studentId}`);
  if (teacherId) revalidatePath(`/teachers/${teacherId}`);

  if (backToStudent && studentId) {
    redirect(`/students/${studentId}`);
  }
  redirect("/payments");
}
