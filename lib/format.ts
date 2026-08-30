import type { GradeLevel, Student } from "@/lib/types";

export function studentName(student: Student) {
  return `${student.lastName}, ${student.preferredName || student.firstName}`;
}

export function studentFullName(student: Student) {
  const preferred =
    student.preferredName && student.preferredName !== student.firstName
      ? ` (${student.preferredName})`
      : "";
  return `${student.firstName} ${student.lastName}${preferred}`;
}

export function gradeLabel(levels: GradeLevel[], id: string) {
  return levels.find((g) => g.id === id)?.nameEn ?? "Grade";
}

export function formatDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
