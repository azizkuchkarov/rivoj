import Link from "next/link";

import { ConsultationIntakeForm } from "@/components/konsultatsiya/ConsultationIntakeForm";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { prisma } from "@/lib/prisma";
import { SCHEDULE_CONSULTATION_PATH } from "@/lib/schedule-paths";

export const dynamic = "force-dynamic";

export default async function ConsultationIntakePage() {
  let teachers;
  try {
    teachers = await prisma.teacher.findMany({
      where: { isActive: true, offersConsultation: true },
      orderBy: [{ listNumber: "asc" }, { fullName: "asc" }],
      select: { id: true, fullName: true, listNumber: true, isActive: true },
    });
  } catch {
    return <DbUnavailable />;
  }

  const defaultDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href={SCHEDULE_CONSULTATION_PATH}
          className="text-sm font-medium text-teal-800/90 underline-offset-4 hover:underline"
        >
          ← Konsultatsiya jadvali
        </Link>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
          Konsultatsiyaga ro‘yxatga olish
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-black">
          Yangi o‘quvchi ma’lumotini kiriting, konsultatsiya o‘qituvchisi va sanani belgilang. Pastda shu o‘qituvchining shu
          kundagi dars va konsultatsiya bandliklari chiqadi — administrator faqat bo‘sh slotga vaqtni belgilaydi.
        </p>
      </div>

      <div className="rounded-[2rem] border border-white/70 bg-[color:var(--surface)] p-6 shadow-xl shadow-black/5 md:p-10">
        {teachers.length === 0 ? (
          <p className="text-sm text-black">
            Konsultatsiya olib boradigan faol o‘qituvchi yo‘q. Avval o‘qituvchi profilida «Konsultatsiya olib boradi»
            belgisini yoqing.
          </p>
        ) : (
          <ConsultationIntakeForm teachers={teachers} defaultDate={defaultDate} />
        )}
      </div>
    </div>
  );
}
