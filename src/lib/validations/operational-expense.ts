import { z } from "zod";

function emptyToUndefined(s: string | undefined) {
  const t = s?.trim();
  return t === "" || t === undefined ? undefined : t;
}

export const operationalExpenseFormSchema = z.object({
  amountSom: z.coerce.number().int().min(1, "Summa kamida 1 so‘m").max(999_999_999, "Summa juda katta"),
  spentAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana noto‘g‘ri"),
  title: z.string().trim().min(1, "Nom kiriting").max(160),
  category: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(4000).optional()),
});

export type OperationalExpenseFormValues = z.infer<typeof operationalExpenseFormSchema>;
