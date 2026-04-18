/** Dars jadvali (asosiy) */
export const SCHEDULE_LESSON_PATH = "/schedule";

/** Konsultatsiya jadvali */
export const SCHEDULE_CONSULTATION_PATH = "/konsultatsiya";

export function normalizeScheduleReturnBase(raw: string): typeof SCHEDULE_LESSON_PATH | typeof SCHEDULE_CONSULTATION_PATH {
  return raw === SCHEDULE_CONSULTATION_PATH ? SCHEDULE_CONSULTATION_PATH : SCHEDULE_LESSON_PATH;
}
