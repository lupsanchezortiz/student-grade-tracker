import { termsForSiteYear } from "@/lib/data/terms";
import type { StoreState, Term } from "@/lib/types";

function newId() {
  return crypto.randomUUID();
}

/** Give each school its own copy of district-wide terms from older stores. */
export function ensureSiteOwnedTerms(state: StoreState) {
  const legacy = state.terms.filter((term) => !term.siteId);
  if (legacy.length === 0) return;

  const extras: Term[] = [];

  for (const year of state.years) {
    const yearLegacy = legacy
      .filter((term) => term.academicYearId === year.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (yearLegacy.length === 0) continue;

    state.sites.forEach((site, index) => {
      if (termsForSiteYear(state, site.id, year.id).length > 0) return;
      if (index === 0) {
        for (const term of yearLegacy) term.siteId = site.id;
        return;
      }
      const remap = new Map<string, string>();
      for (const term of yearLegacy) {
        const copy: Term = { ...term, id: newId(), siteId: site.id };
        remap.set(term.id, copy.id);
        extras.push(copy);
      }
      const courseIds = new Set(
        state.courses
          .filter((course) => course.siteId === site.id && course.academicYearId === year.id)
          .map((course) => course.id),
      );
      const enrollmentIds = new Set(
        state.enrollments.filter((row) => courseIds.has(row.courseId)).map((row) => row.id),
      );
      for (const grade of state.grades) {
        const next = remap.get(grade.termId);
        if (next && enrollmentIds.has(grade.enrollmentId)) grade.termId = next;
      }
      for (const row of state.attendance ?? []) {
        const next = remap.get(row.termId);
        if (next && enrollmentIds.has(row.enrollmentId)) row.termId = next;
      }
    });
  }

  state.terms.push(...extras);
  state.terms = state.terms.filter((term) => Boolean(term.siteId));
}
