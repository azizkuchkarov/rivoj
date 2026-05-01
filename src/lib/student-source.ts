export const STUDENT_SOURCE_VALUES = [
  "INSTAGRAM",
  "TELEGRAM",
  "YOUTUBE",
  "TAVSIYA_TANISH",
  "KOCHA_ESKI",
] as const;

export type StudentSourceValue = (typeof STUDENT_SOURCE_VALUES)[number];

export const STUDENT_SOURCE_OPTIONS: { value: StudentSourceValue; label: string }[] = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TELEGRAM", label: "Telegram" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "TAVSIYA_TANISH", label: "Tavsiya tanish" },
  { value: "KOCHA_ESKI", label: "Ko‘cha / eski mijoz" },
];

export function formatStudentSource(source: StudentSourceValue | string | null | undefined): string {
  if (source === "INSTAGRAM") return "Instagram";
  if (source === "TELEGRAM") return "Telegram";
  if (source === "YOUTUBE") return "YouTube";
  if (source === "TAVSIYA_TANISH") return "Tavsiya tanish";
  if (source === "KOCHA_ESKI") return "Ko‘cha / eski mijoz";
  return "Ko‘rsatilmagan";
}
