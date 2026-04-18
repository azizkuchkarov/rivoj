import { LessonKind } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

/** Bir tranzaksiya ichida darslar yaratish (to‘lov bilan birga) */
type LessonDb = Pick<typeof prisma, "lesson" | "teacher" | "student">;
import { LESSON_DURATION_MINUTES } from "@/lib/schedule-config";
import { getSlotStartMinutesList } from "@/lib/time-minutes";

const ALLOWED_SLOT_STARTS = new Set(getSlotStartMinutesList());

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart;
}

export type BookLessonResult = { ok: true } | { ok: false; error: string };

/**
 * Dars yoki konsultatsiya yozuvini yaratadi (slot bandligi va o‘qituvchi talablari bilan).
 */
export async function bookLesson(params: {
  kind: LessonKind;
  lessonDateYmd: string;
  startMinutes: number;
  teacherId: string;
  studentId: string;
  notes?: string | null;
}): Promise<BookLessonResult> {
  const endMinutes = params.startMinutes + LESSON_DURATION_MINUTES;
  const lessonDate = new Date(`${params.lessonDateYmd}T00:00:00.000Z`);

  const teacherWhere =
    params.kind === LessonKind.CONSULTATION
      ? { id: params.teacherId, isActive: true, offersConsultation: true }
      : { id: params.teacherId, isActive: true };

  const [teacher, student] = await Promise.all([
    prisma.teacher.findFirst({ where: teacherWhere }),
    prisma.student.findFirst({ where: { id: params.studentId, isActive: true } }),
  ]);

  if (!teacher) {
    return {
      ok: false,
      error:
        params.kind === LessonKind.CONSULTATION
          ? "Tanlangan o‘qituvchi topilmadi, nofaol yoki konsultatsiya uchun belgilanmagan."
          : "Tanlangan o‘qituvchi topilmadi yoki nofaol.",
    };
  }
  if (!student) {
    return { ok: false, error: "Tanlangan o‘quvchi topilmadi yoki nofaol." };
  }

  const sameDay = await prisma.lesson.findMany({
    where: { lessonDate },
    select: { id: true, teacherId: true, studentId: true, startMinutes: true, endMinutes: true },
  });

  for (const L of sameDay) {
    if (
      L.teacherId === params.teacherId &&
      rangesOverlap(params.startMinutes, endMinutes, L.startMinutes, L.endMinutes)
    ) {
      return {
        ok: false,
        error: "Bu vaqtda tanlangan o‘qituvchining boshqa bandligi bor (dars yoki konsultatsiya).",
      };
    }
    if (
      L.studentId === params.studentId &&
      rangesOverlap(params.startMinutes, endMinutes, L.startMinutes, L.endMinutes)
    ) {
      return {
        ok: false,
        error: "Bu vaqtda o‘quvchining boshqa bandligi bor (dars yoki konsultatsiya).",
      };
    }
  }

  try {
    await prisma.lesson.create({
      data: {
        kind: params.kind,
        lessonDate,
        startMinutes: params.startMinutes,
        endMinutes,
        teacherId: params.teacherId,
        studentId: params.studentId,
        notes: params.notes ?? undefined,
      },
    });
  } catch {
    return { ok: false, error: "Saqlashda xatolik" };
  }

  return { ok: true };
}

export type LessonSlotInput = { lessonDateYmd: string; startMinutes: number };

function dedupeSlots(slots: LessonSlotInput[]): LessonSlotInput[] {
  const m = new Map<string, LessonSlotInput>();
  for (const s of slots) {
    m.set(`${s.lessonDateYmd}|${s.startMinutes}`, s);
  }
  return [...m.values()];
}

function lessonDateToYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Bir nechta darsni bitta tranzaksiyada yaratadi (barcha slotlar tekshiriladi).
 */
export async function bookLessonsBatch(params: {
  kind: LessonKind;
  teacherId: string;
  studentId: string;
  slots: LessonSlotInput[];
  notes?: string | null;
}): Promise<BookLessonResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const r = await bookLessonsBatchWithDb(tx, params);
      if (!r.ok) throw new Error(r.error);
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Saqlashda xatolik.";
    if (msg.startsWith("BATCH:")) {
      return { ok: false, error: msg.slice(6) };
    }
    return { ok: false, error: msg };
  }
  return { ok: true };
}

/**
 * Bir tranzaksiya klienti orqali (masalan to‘lov bilan birga).
 */
export async function bookLessonsBatchWithDb(
  db: LessonDb,
  params: {
    kind: LessonKind;
    teacherId: string;
    studentId: string;
    slots: LessonSlotInput[];
    notes?: string | null;
  },
): Promise<BookLessonResult> {
  const { kind, teacherId, studentId, notes } = params;
  const slots = dedupeSlots(params.slots);
  if (slots.length === 0) {
    return { ok: false, error: "Kamida bitta vaqt slotini tanlang." };
  }
  if (slots.length > 100) {
    return { ok: false, error: "Bir martada 100 tadan ortiq slot tanlanmaydi." };
  }

  for (const s of slots) {
    if (!ALLOWED_SLOT_STARTS.has(s.startMinutes)) {
      return { ok: false, error: "Slotlar faqat ruxsat etilgan soat boshlarida." };
    }
  }

  const teacherWhere =
    kind === LessonKind.CONSULTATION
      ? { id: teacherId, isActive: true, offersConsultation: true }
      : { id: teacherId, isActive: true };

  const [teacher, student] = await Promise.all([
    db.teacher.findFirst({ where: teacherWhere }),
    db.student.findFirst({ where: { id: studentId, isActive: true } }),
  ]);

  if (!teacher) {
    return {
      ok: false,
      error:
        kind === LessonKind.CONSULTATION
          ? "Tanlangan o‘qituvchi topilmadi, nofaol yoki konsultatsiya uchun belgilanmagan."
          : "Tanlangan o‘qituvchi topilmadi yoki nofaol.",
    };
  }
  if (!student) {
    return { ok: false, error: "Tanlangan o‘quvchi topilmadi yoki nofaol." };
  }

  const uniqueDates = [...new Set(slots.map((s) => s.lessonDateYmd))];
  const dateObjs = uniqueDates.map((d) => new Date(`${d}T00:00:00.000Z`));

  const existing = await db.lesson.findMany({
    where: { lessonDate: { in: dateObjs } },
    select: {
      id: true,
      lessonDate: true,
      teacherId: true,
      studentId: true,
      startMinutes: true,
      endMinutes: true,
    },
  });

  type Virtual = {
    lessonDate: Date;
    teacherId: string;
    studentId: string;
    startMinutes: number;
    endMinutes: number;
  };

  const virtual: Virtual[] = existing.map((L) => ({
    lessonDate: L.lessonDate,
    teacherId: L.teacherId,
    studentId: L.studentId,
    startMinutes: L.startMinutes,
    endMinutes: L.endMinutes,
  }));

  const sorted = [...slots].sort(
    (a, b) => a.lessonDateYmd.localeCompare(b.lessonDateYmd) || a.startMinutes - b.startMinutes,
  );

  for (const s of sorted) {
    const endMinutes = s.startMinutes + LESSON_DURATION_MINUTES;
    const lessonDate = new Date(`${s.lessonDateYmd}T00:00:00.000Z`);

    for (const L of virtual) {
      if (lessonDateToYmd(L.lessonDate) !== s.lessonDateYmd) continue;
      if (
        L.teacherId === teacherId &&
        rangesOverlap(s.startMinutes, endMinutes, L.startMinutes, L.endMinutes)
      ) {
        return {
          ok: false,
          error: `${s.lessonDateYmd} ${s.startMinutes / 60}:00 — bu vaqtda o‘qituvchining boshqa bandligi bor.`,
        };
      }
      if (
        L.studentId === studentId &&
        rangesOverlap(s.startMinutes, endMinutes, L.startMinutes, L.endMinutes)
      ) {
        return {
          ok: false,
          error: `${s.lessonDateYmd} ${s.startMinutes / 60}:00 — o‘quvchi bu vaqtda band.`,
        };
      }
    }

    virtual.push({ lessonDate, teacherId, studentId, startMinutes: s.startMinutes, endMinutes });
  }

  try {
    await Promise.all(
      sorted.map((s) =>
        db.lesson.create({
          data: {
            kind,
            lessonDate: new Date(`${s.lessonDateYmd}T00:00:00.000Z`),
            startMinutes: s.startMinutes,
            endMinutes: s.startMinutes + LESSON_DURATION_MINUTES,
            teacherId,
            studentId,
            notes: notes ?? undefined,
          },
        }),
      ),
    );
  } catch {
    return { ok: false, error: "Saqlashda xatolik." };
  }

  return { ok: true };
}
