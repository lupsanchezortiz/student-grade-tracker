import type {
  CourseTeacher,
  SessionUser,
  StoreState,
  TemplateSection,
} from "@/lib/types";

export function isSpecialistSection(section: Pick<TemplateSection, "gradedBy">) {
  return section.gradedBy === "specialist";
}

export function teacherMayGradeSection(
  teacher: CourseTeacher,
  section: Pick<TemplateSection, "id" | "gradedBy">,
) {
  if (!teacher.canGrade) return false;
  if (isSpecialistSection(section)) {
    return Boolean(teacher.sectionIds?.includes(section.id));
  }
  return teacher.gradesHomeroom ?? !teacher.sectionIds?.length;
}

export function assertDistrict(user: SessionUser) {
  if (!user.isSystemAdmin) {
    throw new Error("Only district administrators can do that.");
  }
}

export function assertSiteAdmin(user: SessionUser, siteId: string) {
  if (user.isSystemAdmin) return;
  const ok = user.memberships.some(
    (m) => m.siteId === siteId && m.role === "site_admin",
  );
  if (!ok) throw new Error("You do not administer this school.");
}

/** Site administrators (and district) load attendance from CSV. Teachers only view it. */
export function canImportAttendance(user: SessionUser, siteId: string) {
  if (user.isSystemAdmin) return true;
  return user.memberships.some((m) => m.siteId === siteId && m.role === "site_admin");
}

export function assertSiteView(user: SessionUser, siteId: string) {
  if (user.isSystemAdmin) return;
  const ok = user.memberships.some((m) => m.siteId === siteId);
  if (!ok) throw new Error("You do not have access to this school.");
}

export function canEditCourse(
  user: SessionUser,
  state: StoreState,
  courseId: string,
) {
  if (user.isSystemAdmin) return true;
  const course = state.courses.find((c) => c.id === courseId);
  if (!course) return false;
  const isSiteAdmin = user.memberships.some(
    (m) => m.siteId === course.siteId && m.role === "site_admin",
  );
  if (isSiteAdmin) return true;
  return state.courseTeachers.some(
    (t) => t.courseId === courseId && t.profileId === user.id && t.canGrade,
  );
}

export function canPrintCourse(
  user: SessionUser,
  state: StoreState,
  courseId: string,
) {
  if (canEditCourse(user, state, courseId)) return true;
  return state.courseTeachers.some(
    (t) => t.courseId === courseId && t.profileId === user.id && t.canPrint,
  );
}

export function canViewCourse(
  user: SessionUser,
  state: StoreState,
  courseId: string,
) {
  const course = state.courses.find((c) => c.id === courseId);
  if (!course) return false;
  if (user.isSystemAdmin) return true;
  if (user.memberships.some((m) => m.siteId === course.siteId)) return true;
  return state.courseTeachers.some(
    (t) => t.courseId === courseId && t.profileId === user.id,
  );
}

export function canEditCourseItem(
  user: SessionUser,
  state: StoreState,
  courseId: string,
  templateItemId: string,
) {
  if (!canEditCourse(user, state, courseId)) return false;
  if (user.isSystemAdmin) return true;
  const course = state.courses.find((c) => c.id === courseId);
  if (!course) return false;
  const isSiteAdmin = user.memberships.some(
    (m) => m.siteId === course.siteId && m.role === "site_admin",
  );
  if (isSiteAdmin) return true;
  const teacher = state.courseTeachers.find(
    (t) => t.courseId === courseId && t.profileId === user.id && t.canGrade,
  );
  if (!teacher) return false;
  const item = state.items.find((i) => i.id === templateItemId);
  if (!item) return false;
  const section = state.sections.find((s) => s.id === item.sectionId);
  if (!section) return false;
  return teacherMayGradeSection(teacher, section);
}

export function editableItemIdsForCourse(
  user: SessionUser,
  state: StoreState,
  courseId: string,
) {
  const course = state.courses.find((c) => c.id === courseId);
  if (!course) return [];
  return state.items
    .filter((item) => {
      const section = state.sections.find((s) => s.id === item.sectionId);
      return section?.templateId === course.templateId;
    })
    .filter((item) => canEditCourseItem(user, state, courseId, item.id))
    .map((item) => item.id);
}
