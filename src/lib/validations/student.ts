import { z } from "zod";

import { STUDENT_GENDER_VALUES } from "@/lib/student-gender";
import { STUDENT_GROUP_VALUES } from "@/lib/student-group";
import { STUDENT_SOURCE_VALUES } from "@/lib/student-source";

function emptyToUndefined(s: string | undefined) {
  const t = s?.trim();
  return t === "" || t === undefined ? undefined : t;
}

export const studentFormSchema = z.object({
  fullName: z.string().trim().min(2, "Ism kamida 2 belgi bo‘lishi kerak").max(120),
  group: z.enum(STUDENT_GROUP_VALUES, { message: "Guruhni tanlang" }),
  source: z.enum(STUDENT_SOURCE_VALUES, { message: "O‘quvchi manbasini tanlang" }),
  dateOfBirth: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : String(v)),
    z
      .union([
        z.undefined(),
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD ko‘rinishida bo‘lishi kerak"),
      ])
      .transform((v) => (v === undefined ? undefined : new Date(`${v}T00:00:00.000Z`))),
  ),
  /// `male` | `female` yoki avvalgi matnli yozuvlar (max 40 belgi)
  gender: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : String(v)),
    z
      .union([z.undefined(), z.enum(STUDENT_GENDER_VALUES), z.string().max(40)])
      .optional(),
  ),
  guardianName: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  guardianPhone: z.preprocess(emptyToUndefined, z.string().trim().max(32).optional()),
  telegramChatId: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^-?\d+$/, "Telegram chat ID faqat raqamlardan iborat bo‘lsin")
      .max(32)
      .optional(),
  ),
  notes: z.preprocess(emptyToUndefined, z.string().max(8000).optional()),
  focusAreas: z
    .string()
    .transform((s) =>
      s
        .split(/[,;\n]/)
        .map((x) => x.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().max(80)).max(24)),
  primaryTeacherId: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : String(v)),
    z.union([z.undefined(), z.string().min(1)]),
  ),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
