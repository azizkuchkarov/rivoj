/** @param d — faqat sana (vaqt zonasi uchun UTC ishlatiladi) */
export function ageFromDateOfBirth(d: Date): number {
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const md = now.getUTCMonth() - d.getUTCMonth();
  if (md < 0 || (md === 0 && now.getUTCDate() < d.getUTCDate())) {
    age -= 1;
  }
  return age;
}
