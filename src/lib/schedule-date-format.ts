import { addDaysUTC } from "@/lib/week-utils";

/** Server va brauzerda bir xil (hydration xavfsiz), UTC sanalar uchun */
const MONTHS_LONG = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentyabr",
  "oktyabr",
  "noyabr",
  "dekabr",
] as const;

const MONTHS_SHORT = [
  "yan",
  "fev",
  "mar",
  "apr",
  "may",
  "iyn",
  "iyl",
  "avg",
  "sen",
  "okt",
  "noy",
  "dek",
] as const;

/** Dushanba = 0 … yakshanba = 6 */
const WEEKDAY_SHORT_MON = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"] as const;

const WEEKDAY_LONG_MON = [
  "dushanba",
  "seshanba",
  "chorshanba",
  "payshanba",
  "juma",
  "shanba",
  "yakshanba",
] as const;

function ymdFromUtcDate(d: Date): { y: number; m: number; day: number } {
  const [y, mo, day] = d.toISOString().slice(0, 10).split("-").map(Number);
  return { y, m: mo - 1, day };
}

/** Hafta oralig‘i: «13 aprel — 19 aprel, 2026» */
export function formatWeekRangeLabelUtc(weekMonday: Date): string {
  const a = ymdFromUtcDate(weekMonday);
  const sun = addDaysUTC(weekMonday, 6);
  const b = ymdFromUtcDate(sun);
  return `${a.day} ${MONTHS_LONG[a.m]} — ${b.day} ${MONTHS_LONG[b.m]}, ${b.y}`;
}

/** Ustun sarlavhasi: «Du 13 apr» */
export function formatScheduleColumnHeadUtc(dayIso: string): string {
  const d = new Date(`${dayIso}T12:00:00.000Z`);
  const monFirst = (d.getUTCDay() + 6) % 7;
  const { m, day } = ymdFromUtcDate(d);
  return `${WEEKDAY_SHORT_MON[monFirst]} ${day} ${MONTHS_SHORT[m]}`;
}

/** Kengaytirilgan ro‘yxat: «dushanba, 13 apr» (Intl month: short bilan yaqin) */
export function formatLessonRowDayUzUtc(lessonDate: Date): string {
  const d = new Date(lessonDate.toISOString().slice(0, 10) + "T12:00:00.000Z");
  const monFirst = (d.getUTCDay() + 6) % 7;
  const { m, day } = ymdFromUtcDate(d);
  return `${WEEKDAY_LONG_MON[monFirst]}, ${day} ${MONTHS_SHORT[m]}`;
}

/** Modal sarlavha: «dushanba, 13 aprel» (weekday + month long) */
export function formatLessonDateHeadingUzUtc(lessonDate: Date): string {
  const d = new Date(lessonDate.toISOString().slice(0, 10) + "T12:00:00.000Z");
  const monFirst = (d.getUTCDay() + 6) % 7;
  const { m, day } = ymdFromUtcDate(d);
  return `${WEEKDAY_LONG_MON[monFirst]}, ${day} ${MONTHS_LONG[m]}`;
}

/** Reja jadvali: faqat hafta kuni (qator 1) */
export function formatPlannerGridWeekdayUtc(dayIso: string): string {
  const d = new Date(`${dayIso}T12:00:00.000Z`);
  const monFirst = (d.getUTCDay() + 6) % 7;
  return WEEKDAY_SHORT_MON[monFirst];
}

/** Reja jadvali: kun va qisqa oy (qator 2) */
export function formatPlannerGridDayMonthUtc(dayIso: string): string {
  const d = new Date(`${dayIso}T12:00:00.000Z`);
  const { m, day } = ymdFromUtcDate(d);
  return `${day} ${MONTHS_SHORT[m]}`;
}

/** Rejalashtiruvchi: «13 apr — 19 apr, 2026» (qisqa oy) */
export function formatPlannerWeekBandUtc(weekMonday: Date): string {
  const a = ymdFromUtcDate(weekMonday);
  const sun = addDaysUTC(weekMonday, 6);
  const b = ymdFromUtcDate(sun);
  return `${a.day} ${MONTHS_SHORT[a.m]} — ${b.day} ${MONTHS_SHORT[b.m]}, ${b.y}`;
}
