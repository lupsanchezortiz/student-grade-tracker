import { normalizeLayout } from "@/lib/data/layout";
import { parseTermStructure } from "@/lib/data/terms";
import type {
  CourseDetail,
  GradeScaleMark,
  StoreState,
  TemplateDetail,
  TemplateItem,
  TermStructure,
} from "@/lib/types";

function marksByScale(state: StoreState): Record<string, GradeScaleMark[]> {
  const next: Record<string, GradeScaleMark[]> = {};
  for (const mark of state.marks) {
    (next[mark.scaleId] ??= []).push(mark);
  }
  for (const list of Object.values(next)) {
    list.sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return next;
}

export function itemScaleId(item: TemplateItem, fallbackScaleId?: string) {
  if (item.itemType !== "mark") return undefined;
  return item.gradeScaleId || fallbackScaleId;
}

export function hydrateTemplate(
  state: StoreState,
  templateId: string,
): TemplateDetail | null {
  const template = state.templates.find((t) => t.id === templateId);
  if (!template) return null;
  const byScale = marksByScale(state);
  const sections = state.sections
    .filter((s) => s.templateId === template.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((section) => ({
      ...section,
      items: state.items
        .filter((i) => i.sectionId === section.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  const scaleIds = new Set<string>();
  for (const section of sections) {
    for (const item of section.items) {
      const scaleId = itemScaleId(item, template.gradeScaleId);
      if (scaleId) scaleIds.add(scaleId);
    }
  }
  const scale =
    state.scales.find((s) => scaleIds.has(s.id)) ??
    state.scales.find((s) => s.id === template.gradeScaleId) ??
    state.scales[0];
  if (!scale) return null;
  if (!scaleIds.size) scaleIds.add(scale.id);
  const marks = [...scaleIds].flatMap((id) => byScale[id] ?? []);
  const termStructure =
    template.termStructure ??
    parseTermStructure(
      state.years.find((y) => y.id === template.academicYearId)?.termStructure ?? "trimester",
    );
  return {
    ...template,
    termStructure,
    layout: normalizeLayout(template.layout),
    scale,
    marks,
    marksByScaleId: byScale,
    gradeLevelIds: state.templateGradeLevels
      .filter((x) => x.templateId === template.id)
      .map((x) => x.gradeLevelId),
    sections,
  };
}

export function hydrateCourse(
  state: StoreState,
  courseId: string,
): CourseDetail | null {
  const course = state.courses.find((c) => c.id === courseId);
  if (!course) return null;
  const site = state.sites.find((s) => s.id === course.siteId);
  const year = state.years.find((y) => y.id === course.academicYearId);
  const gradeLevel = state.gradeLevels.find((g) => g.id === course.gradeLevelId);
  const template = hydrateTemplate(state, course.templateId);
  if (!site || !year || !gradeLevel || !template) return null;
  return {
    ...course,
    site,
    year,
    gradeLevel,
    template,
    teachers: state.courseTeachers
      .filter((t) => t.courseId === course.id)
      .map((t) => {
        const profile = state.profiles.find((p) => p.id === t.profileId);
        if (!profile) return null;
        return { ...t, profile };
      })
      .filter((t): t is CourseDetail["teachers"][number] => Boolean(t)),
    enrollments: state.enrollments
      .filter((e) => e.courseId === course.id)
      .map((e) => {
        const student = state.students.find((s) => s.id === e.studentId);
        if (!student) return null;
        return { ...e, student };
      })
      .filter((e): e is CourseDetail["enrollments"][number] => Boolean(e))
      .sort((a, b) =>
        `${a.student.lastName} ${a.student.firstName}`.localeCompare(
          `${b.student.lastName} ${b.student.firstName}`,
        ),
      ),
  };
}

export function findTemplateForGrade(
  state: StoreState,
  academicYearId: string,
  gradeLevelId: string,
  termStructure?: TermStructure,
) {
  const year = state.years.find((y) => y.id === academicYearId);
  if (!year) return undefined;
  const structure = termStructure ?? year.termStructure ?? "trimester";
  const ids = state.templateGradeLevels
    .filter((x) => x.gradeLevelId === gradeLevelId)
    .map((x) => x.templateId);
  return state.templates
    .filter(
      (t) =>
        t.status === "published" &&
        ids.includes(t.id) &&
        (t.termStructure ?? structure) === structure,
    )
    .sort((a, b) => {
      if (a.locale === b.locale) return 0;
      if (a.locale === "en") return -1;
      if (b.locale === "en") return 1;
      return a.locale.localeCompare(b.locale);
    })[0];
}
