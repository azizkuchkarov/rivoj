import {
  CENTER_OPEN_HOUR,
  LAST_LESSON_START_HOUR,
  LESSON_DURATION_MINUTES,
} from "@/lib/schedule-config";

/** Daqiqalarni «09:00» ko‘rinishida */
export function formatMinutesAsClock(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Soatli slotlar boshlanishi: 8:00, 9:00, …, 17:00 */
export function getSlotStartMinutesList(): number[] {
  const out: number[] = [];
  for (let h = CENTER_OPEN_HOUR; h <= LAST_LESSON_START_HOUR; h++) {
    out.push(h * 60);
  }
  return out;
}

/** @deprecated use getSlotStartMinutesList */
export function getStartTimeOptions(): number[] {
  return getSlotStartMinutesList();
}

export function formatSlotRangeLabel(startMinutes: number): string {
  const end = startMinutes + LESSON_DURATION_MINUTES;
  return `${formatMinutesAsClock(startMinutes)} – ${formatMinutesAsClock(end)}`;
}
