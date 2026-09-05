import { normalizeLayout } from "@/lib/data/layout";
import type {
  CourseDetail,
  StoreState,
  TemplateDetail,
} from "@/lib/types";

export function hydrateTemplate(
  state: StoreState,
  templateId: string,
): TemplateDetail | null {
  const template = state.templates.find((t) => t.id === templateId);
  if (!template) return null;
  const year = state.years.find((y) => y.id === template.academicYearId);
  const scale = state.scales.find((s) => s.id === template.gradeScaleId);
  if (!year || !scale) return null;
  const marks = state.marks
    .filter((m) => m.scaleId === scale.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const sections = state.sections
    .filter((s) => s.templateId === template.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((section) => ({
      ...section,
      items: state.items
        .filter((i) => i.sectionId === section.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  return {
    ...template,
    layout: normalizeLayout(template.layout),
    year,
    scale,
    marks,
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
) {
  const ids = state.templateGradeLevels
    .filter((x) => x.gradeLevelId === gradeLevelId)
    .map((x) => x.templateId);
  return state.templates.find(
    (t) =>
      t.academicYearId === academicYearId &&
      t.status === "published" &&
      ids.includes(t.id),
  );
}
