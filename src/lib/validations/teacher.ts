import { z } from "zod";

function emptyToUndefined(s: string | undefined) {
  const t = s?.trim();
  return t === "" || t === undefined ? undefined : t;
}

export const teacherFormSchema = z.object({
  listNumber: z.coerce.number().int().min(1, "№ kamida 1 bo‘lishi kerak").max(999, "№ 999 dan oshmasligi kerak"),
  fullName: z.string().trim().min(2, "Ism kamida 2 belgi bo‘lishi kerak").max(120),
  title: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(32).optional()),
  telegramChatId: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^-?\d+$/, "Telegram chat ID faqat raqamlardan iborat bo‘lsin")
      .max(32)
      .optional(),
  ),
  photoUrl: z.preprocess(
    emptyToUndefined,
    z.union([z.undefined(), z.string().url("Rasm URL noto‘g‘ri")]),
  ),
  specialties: z
    .string()
    .transform((s) =>
      s
        .split(/[,;\n]/)
        .map((x) => x.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().max(80)).max(24)),
  experienceYears: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : v),
    z.coerce.number().int().min(0).max(80).optional(),
  ),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true"),
  offersConsultation: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export type TeacherFormValues = z.infer<typeof teacherFormSchema>;
