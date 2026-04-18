/** Markaz ish vaqti (soat) */
export const CENTER_OPEN_HOUR = 8;
export const CENTER_CLOSE_HOUR = 18;

/** Kun boshidan daqiqalar (0–1439) */
export const CENTER_DAY_START_MINUTES = CENTER_OPEN_HOUR * 60;
export const CENTER_DAY_END_MINUTES = CENTER_CLOSE_HOUR * 60;

/** Bitta dars davomiyligi (masalan 8:00 → 8:50) */
export const LESSON_DURATION_MINUTES = 50;

/**
 * Soatlik slotlar: keyingi dars yangi soat boshida (masalan 8:50 dan keyin 9:00).
 * Oxirgi ruxsat etilgan boshlanish: 17:00 (tugash 17:50, markaz 18:00 gacha).
 */
export const LAST_LESSON_START_HOUR = 17;

/** Jadval chizig‘ida ko‘rinadigan umumiy vaqt oralig‘i (08:00–18:00) */
export const CENTER_SCHEDULE_DURATION_MINUTES = CENTER_DAY_END_MINUTES - CENTER_DAY_START_MINUTES;
