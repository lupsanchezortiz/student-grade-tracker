import type { StoreState, Term, TermStructure } from "@/lib/types";

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
  siteId: string,
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
      siteId,
      sortOrder: i + 1,
      nameEn: part.nameEn,
      nameEs: part.nameEs,
      startDate: start,
      endDate: end,
    };
  });
}

export function structureFromTermCount(count: number): TermStructure {
  if (count <= 2) return "semester";
  if (count >= 4) return "quarter";
  return "trimester";
}

export function termsForSiteYear(state: StoreState, siteId: string, yearId: string) {
  return state.terms
    .filter((term) => term.academicYearId === yearId && term.siteId === siteId)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function siteTermStructure(state: StoreState, siteId: string, yearId: string) {
  const terms = termsForSiteYear(state, siteId, yearId);
  if (terms.length === 0) return null;
  return structureFromTermCount(terms.length);
}

export { STRUCTURES as TERM_STRUCTURE_LABELS };

export const TERM_STRUCTURE_NAMES: Record<TermStructure, string> = {
  semester: "Semester",
  trimester: "Trimester",
  quarter: "Quarter",
};

export function termStructureName(structure: TermStructure) {
  return TERM_STRUCTURE_NAMES[structure] ?? structure;
}

export function parseTermStructure(raw: string): TermStructure {
  const value = raw.trim().toLowerCase();
  if (value === "semester" || value === "quarter") return value;
  return "trimester";
}
