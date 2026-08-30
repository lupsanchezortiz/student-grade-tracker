import type { Term, TermStructure } from "@/lib/types";

type TermBlueprint = { nameEn: string; nameEs: string };

const STRUCTURES: Record<TermStructure, TermBlueprint[]> = {
  semester: [
    { nameEn: "Semester 1", nameEs: "Semestre 1" },
    { nameEn: "Semester 2", nameEs: "Semestre 2" },
  ],
  trimester: [
    { nameEn: "Trimester 1", nameEs: "Trimestre 1" },
    { nameEn: "Trimester 2", nameEs: "Trimestre 2" },
    { nameEn: "Trimester 3", nameEs: "Trimestre 3" },
  ],
  quarter: [
    { nameEn: "Quarter 1", nameEs: "Trimestre académico 1" },
    { nameEn: "Quarter 2", nameEs: "Trimestre académico 2" },
    { nameEn: "Quarter 3", nameEs: "Trimestre académico 3" },
    { nameEn: "Quarter 4", nameEs: "Trimestre académico 4" },
  ],
};

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  const start = new Date(`${a}T00:00:00`).getTime();
  const end = new Date(`${b}T00:00:00`).getTime();
  return Math.round((end - start) / 86400000);
}

export function buildTerms(
  academicYearId: string,
  structure: TermStructure,
  startDate: string,
  endDate: string,
): Omit<Term, "id">[] {
  const parts = STRUCTURES[structure];
  const span = Math.max(daysBetween(startDate, endDate), parts.length);
  const slice = Math.floor(span / parts.length);
  return parts.map((part, i) => {
    const start = i === 0 ? startDate : addDays(startDate, slice * i + 1);
    const end = i === parts.length - 1 ? endDate : addDays(startDate, slice * (i + 1));
    return {
      academicYearId,
      sortOrder: i + 1,
      nameEn: part.nameEn,
      nameEs: part.nameEs,
      startDate: start,
      endDate: end,
    };
  });
}

export { STRUCTURES as TERM_STRUCTURE_LABELS };
