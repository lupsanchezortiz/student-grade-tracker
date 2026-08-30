import type { SessionUser, StoreState } from "@/lib/types";

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
