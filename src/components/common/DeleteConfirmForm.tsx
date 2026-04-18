"use client";

import { Trash2 } from "lucide-react";

import { cn } from "@/lib/cn";

type DeleteConfirmFormProps = {
  action: (formData: FormData) => Promise<void>;
  id: string;
  displayName: string;
  /** Masalan: «O‘qituvchini» yoki «O‘quvchini» */
  entityLabel: string;
  /** true bo‘lsa, server o‘chirishdan keyin o‘quvchi profiliga qaytaradi (to‘lovlar uchun) */
  redirectToStudentProfile?: boolean;
  /** Jadval ichida ixcham tugma */
  compact?: boolean;
};

export function DeleteConfirmForm({
  action,
  id,
  displayName,
  entityLabel,
  redirectToStudentProfile = false,
  compact = false,
}: DeleteConfirmFormProps) {
  const message = `${entityLabel} «${displayName}» o‘chirilsinmi? Bog‘liq jadval yozuvlari ham o‘chiriladi. Bu amalni qaytarib bo‘lmaydi.`;

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={id} />
      {redirectToStudentProfile ? <input type="hidden" name="redirectToStudent" value="1" /> : null}
      <button
        type="submit"
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-full border border-red-200/90 bg-white/90 font-semibold text-red-800 shadow-sm transition hover:bg-red-50",
          compact ? "px-2.5 py-1.5 text-xs" : "gap-2 px-5 py-2.5 text-sm",
        )}
        title="O‘chirish"
      >
        <Trash2 className={cn("shrink-0", compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
        {!compact ? "O‘chirish" : null}
      </button>
    </form>
  );
}
