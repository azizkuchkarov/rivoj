export const STUDENT_GROUP_VALUES = ["LOGOPED", "ABA", "SENSORY_INTEGRATION", "SENSORIMOTOR"] as const;

export type StudentGroupValue = (typeof STUDENT_GROUP_VALUES)[number];

export const STUDENT_GROUP_OPTIONS: { value: StudentGroupValue; label: string }[] = [
  { value: "LOGOPED", label: "Logoped" },
  { value: "ABA", label: "ABA" },
  { value: "SENSORY_INTEGRATION", label: "Sensor Integratsiya" },
  { value: "SENSORIMOTOR", label: "Sensomotorika" },
];

export function formatStudentGroup(group: StudentGroupValue | string | null | undefined): string {
  if (group === "ABA") return "ABA";
  if (group === "SENSORY_INTEGRATION") return "Sensor Integratsiya";
  if (group === "SENSORIMOTOR") return "Sensomotorika";
  return "Logoped";
}
