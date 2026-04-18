/** ISO hafta: dushanba (UTC, sana bilan) */
export function startOfWeekMondayUTC(from: Date): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export function toISODateStringUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDaysUTC(d: Date, days: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

export function parseWeekMondayParam(week?: string): Date {
  if (week && /^\d{4}-\d{2}-\d{2}$/.test(week)) {
    const candidate = new Date(`${week}T12:00:00.000Z`);
    return startOfWeekMondayUTC(candidate);
  }
  return startOfWeekMondayUTC(new Date());
}

/** Kunlik jadval uchun sana (UTC kun) — `date` bo‘lmasa bugun */
export function parseDayParam(date?: string): Date {
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(`${date}T00:00:00.000Z`);
  }
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}
