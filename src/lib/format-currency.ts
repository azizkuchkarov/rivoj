/** So‘mni o‘qish qulay ko‘rinishda (masalan: 1 250 000) */
export function formatSomUZS(amount: number): string {
  return new Intl.NumberFormat("uz-UZ", {
    maximumFractionDigits: 0,
  }).format(amount);
}
