"use server";

import { revalidatePath } from "next/cache";

import { SystemProfileRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type SaveSystemProfileState = {
  error?: string;
  success?: string;
};

export async function saveSystemProfile(
  _prev: SaveSystemProfileState,
  formData: FormData,
): Promise<SaveSystemProfileState> {
  const roleRaw = String(formData.get("role") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const telegramChatIdRaw = String(formData.get("telegramChatId") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "true") === "true";

  if (roleRaw !== SystemProfileRole.MANAGER && roleRaw !== SystemProfileRole.ADMIN) {
    return { error: "Profil turi noto‘g‘ri." };
  }
  if (fullName.length < 2) {
    return { error: "Ism kamida 2 belgi bo‘lsin." };
  }
  const telegramChatId = telegramChatIdRaw === "" ? null : telegramChatIdRaw;
  if (telegramChatId && !/^-?\d+$/.test(telegramChatId)) {
    return { error: "Telegram chat ID faqat raqam bo‘lishi kerak." };
  }

  try {
    await prisma.systemProfile.upsert({
      where: { role: roleRaw },
      create: {
        role: roleRaw,
        fullName,
        telegramChatId,
        isActive,
      },
      update: {
        fullName,
        telegramChatId,
        isActive,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Saqlashda xatolik";
    return { error: msg };
  }

  revalidatePath("/profiles");
  return { success: "Profil saqlandi." };
}
