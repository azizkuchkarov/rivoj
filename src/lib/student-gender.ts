/** DB va forma qiymatlari */
export const STUDENT_GENDER_VALUES = ["male", "female"] as const;
export type StudentGenderValue = (typeof STUDENT_GENDER_VALUES)[number];

export const STUDENT_GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Tanlanmagan" },
  { value: "male", label: "O‘g‘il bola" },
  { value: "female", label: "Qiz bola" },
];

/** Kartochka va profilda ko‘rsatish */
export function formatStudentGender(gender: string | null | undefined): string | null {
  if (!gender) return null;
  if (gender === "male") return "O‘g‘il bola";
  if (gender === "female") return "Qiz bola";
  return gender;
}
