import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import {
  assertDistrict,
  assertSiteAdmin,
  assertSiteView,
  canEditCourse,
  canPrintCourse,
  canViewCourse,
} from "@/lib/data/access";
import { findTemplateForGrade, hydrateCourse, hydrateTemplate } from "@/lib/data/hydrate";
import { loadState, mutateState, resetState } from "@/lib/data/store";
import { buildTerms } from "@/lib/data/terms";
import type {
  AcademicYear,
  Course,
  Grade,
  GradeScale,
  GradeScaleMark,
  ItemType,
  Locale,
  Profile,
  Site,
  SiteRole,
  Student,
  TemplateItem,
  TemplateSection,
  Term,
  TermStructure,
} from "@/lib/types";

const id = () => crypto.randomUUID();

export async function getBootstrap() {
  const user = await requireUser();
  const state = loadState();
  const sites = user.isSystemAdmin
    ? state.sites
    : state.sites.filter((s) =>
        user.memberships.some((m) => m.siteId === s.id),
      );
  return { user, sites, years: state.years, gradeLevels: state.gradeLevels };
}

export async function listSites() {
  const { sites } = await getBootstrap();
  return sites;
}

export async function getSite(siteId: string) {
  const user = await requireUser();
  assertSiteView(user, siteId);
  const site = loadState().sites.find((s) => s.id === siteId);
  if (!site) throw new Error("School not found.");
  return site;
}

export async function createSite(input: {
  name: string;
  code: string;
  address: string;
}) {
  const user = await requireUser();
  assertDistrict(user);
  if (!input.name.trim() || !input.code.trim()) {
    throw new Error("Name and code are required.");
  }
  return mutateState((state) => {
    const site: Site = {
      id: id(),
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      address: input.address.trim(),
      createdAt: new Date().toISOString(),
    };
    state.sites.push(site);
    return site;
  });
}

export async function updateSite(
  siteId: string,
  input: { name: string; code: string; address: string },
) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const site = state.sites.find((s) => s.id === siteId);
    if (!site) throw new Error("School not found.");
    site.name = input.name.trim();
    site.code = input.code.trim().toUpperCase();
    site.address = input.address.trim();
    return site;
  });
}

export async function listYears() {
  await requireUser();
  return loadState().years.slice().sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export async function getYear(yearId: string) {
  await requireUser();
  const state = loadState();
  const year = state.years.find((y) => y.id === yearId);
  if (!year) throw new Error("School year not found.");
  const terms = state.terms
    .filter((t) => t.academicYearId === yearId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return { year, terms };
}

export async function createYear(input: {
  name: string;
  startDate: string;
  endDate: string;
  termStructure: TermStructure;
}) {
  const user = await requireUser();
  assertDistrict(user);
  if (!input.name.trim() || !input.startDate || !input.endDate) {
    throw new Error("Name and dates are required.");
  }
  return mutateState((state) => {
    const year: AcademicYear = {
      id: id(),
      name: input.name.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      termStructure: input.termStructure,
    };
    state.years.push(year);
    const terms = buildTerms(
      year.id,
      input.termStructure,
      input.startDate,
      input.endDate,
    );
    for (const term of terms) {
      state.terms.push({ ...term, id: id() });
    }
    return year;
  });
}

export async function updateYear(
  yearId: string,
  input: { name: string; startDate: string; endDate: string },
) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const year = state.years.find((y) => y.id === yearId);
    if (!year) throw new Error("School year not found.");
    year.name = input.name.trim();
    year.startDate = input.startDate;
    year.endDate = input.endDate;
    return year;
  });
}

export async function updateTerm(
  termId: string,
  input: { nameEn: string; nameEs: string; startDate: string; endDate: string },
) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const term = state.terms.find((t) => t.id === termId);
    if (!term) throw new Error("Term not found.");
    term.nameEn = input.nameEn.trim();
    term.nameEs = input.nameEs.trim();
    term.startDate = input.startDate;
    term.endDate = input.endDate;
    return term;
  });
}

export async function listGradeLevels() {
  await requireUser();
  return loadState()
    .gradeLevels.slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listScales() {
  await requireUser();
  const state = loadState();
  return state.scales.map((scale) => ({
    ...scale,
    marks: state.marks
      .filter((m) => m.scaleId === scale.id)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}

export async function createScale(input: {
  name: string;
  marks: Omit<GradeScaleMark, "id" | "scaleId">[];
}) {
  const user = await requireUser();
  assertDistrict(user);
  if (!input.name.trim() || input.marks.length === 0) {
    throw new Error("A scale needs a name and at least one mark.");
  }
  return mutateState((state) => {
    const scale: GradeScale = { id: id(), name: input.name.trim() };
    state.scales.push(scale);
    for (const mark of input.marks) {
      state.marks.push({
        id: id(),
        scaleId: scale.id,
        code: mark.code.trim(),
        labelEn: mark.labelEn.trim(),
        labelEs: mark.labelEs.trim(),
        sortOrder: mark.sortOrder,
        isPassing: mark.isPassing,
      });
    }
    return scale;
  });
}

export async function listTemplates() {
  await requireUser();
  const state = loadState();
  return state.templates
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => {
      const detail = hydrateTemplate(state, t.id);
      return {
        ...t,
        yearName: detail?.year.name ?? "",
        scaleName: detail?.scale.name ?? "",
        gradeLevelIds: detail?.gradeLevelIds ?? [],
        itemCount: detail?.sections.reduce((n, s) => n + s.items.length, 0) ?? 0,
      };
    });
}

export async function getTemplate(templateId: string) {
  await requireUser();
  const detail = hydrateTemplate(loadState(), templateId);
  if (!detail) throw new Error("Template not found.");
  return detail;
}

export async function createTemplate(input: {
  name: string;
  academicYearId: string;
  gradeScaleId: string;
  gradeLevelIds: string[];
}) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const template = {
      id: id(),
      name: input.name.trim(),
      academicYearId: input.academicYearId,
      gradeScaleId: input.gradeScaleId,
      status: "draft" as const,
    };
    state.templates.push(template);
    for (const gradeLevelId of input.gradeLevelIds) {
      state.templateGradeLevels.push({ templateId: template.id, gradeLevelId });
    }
    return hydrateTemplate(state, template.id)!;
  });
}

export async function updateTemplate(
  templateId: string,
  input: {
    name: string;
    academicYearId: string;
    gradeScaleId: string;
    gradeLevelIds: string[];
  },
) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const template = state.templates.find((t) => t.id === templateId);
    if (!template) throw new Error("Template not found.");
    if (template.status === "published" && input.gradeScaleId !== template.gradeScaleId) {
      const used = state.courses.some((c) => c.templateId === templateId);
      if (used) {
        throw new Error("This template already has gradebooks. Keep the same grade scale.");
      }
    }
    template.name = input.name.trim();
    template.academicYearId = input.academicYearId;
    template.gradeScaleId = input.gradeScaleId;
    state.templateGradeLevels = state.templateGradeLevels.filter(
      (x) => x.templateId !== templateId,
    );
    for (const gradeLevelId of input.gradeLevelIds) {
      state.templateGradeLevels.push({ templateId, gradeLevelId });
    }
    return hydrateTemplate(state, templateId)!;
  });
}

export async function publishTemplate(templateId: string) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const template = state.templates.find((t) => t.id === templateId);
    if (!template) throw new Error("Template not found.");
    const detail = hydrateTemplate(state, templateId);
    if (!detail?.sections.some((s) => s.items.length > 0)) {
      throw new Error("Add at least one graded item before publishing.");
    }
    if (detail.gradeLevelIds.length === 0) {
      throw new Error("Assign this card to at least one grade level.");
    }
    template.status = "published";
    return hydrateTemplate(state, templateId)!;
  });
}

export async function addSection(
  templateId: string,
  input: { titleEn: string; titleEs: string },
) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const max = Math.max(
      0,
      ...state.sections.filter((s) => s.templateId === templateId).map((s) => s.sortOrder),
    );
    const section: TemplateSection = {
      id: id(),
      templateId,
      sortOrder: max + 1,
      titleEn: input.titleEn.trim(),
      titleEs: input.titleEs.trim(),
    };
    state.sections.push(section);
    return section;
  });
}

export async function updateSection(
  sectionId: string,
  input: { titleEn: string; titleEs: string },
) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const section = state.sections.find((s) => s.id === sectionId);
    if (!section) throw new Error("Section not found.");
    section.titleEn = input.titleEn.trim();
    section.titleEs = input.titleEs.trim();
    return section;
  });
}

export async function deleteSection(sectionId: string) {
  const user = await requireUser();
  assertDistrict(user);
  mutateState((state) => {
    const itemIds = state.items.filter((i) => i.sectionId === sectionId).map((i) => i.id);
    state.grades = state.grades.filter((g) => !itemIds.includes(g.templateItemId));
    state.items = state.items.filter((i) => i.sectionId !== sectionId);
    state.sections = state.sections.filter((s) => s.id !== sectionId);
  });
}

export async function moveSection(sectionId: string, direction: "up" | "down") {
  const user = await requireUser();
  assertDistrict(user);
  mutateState((state) => {
    const section = state.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const siblings = state.sections
      .filter((s) => s.templateId === section.templateId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const index = siblings.findIndex((s) => s.id === sectionId);
    const swapWith = direction === "up" ? siblings[index - 1] : siblings[index + 1];
    if (!swapWith) return;
    const tmp = section.sortOrder;
    section.sortOrder = swapWith.sortOrder;
    swapWith.sortOrder = tmp;
  });
}

export async function addItem(
  sectionId: string,
  input: { titleEn: string; titleEs: string; itemType: ItemType },
) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const max = Math.max(
      0,
      ...state.items.filter((i) => i.sectionId === sectionId).map((i) => i.sortOrder),
    );
    const item: TemplateItem = {
      id: id(),
      sectionId,
      sortOrder: max + 1,
      titleEn: input.titleEn.trim(),
      titleEs: input.titleEs.trim(),
      itemType: input.itemType,
    };
    state.items.push(item);
    return item;
  });
}

export async function updateItem(
  itemId: string,
  input: { titleEn: string; titleEs: string; itemType: ItemType },
) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const item = state.items.find((i) => i.id === itemId);
    if (!item) throw new Error("Item not found.");
    item.titleEn = input.titleEn.trim();
    item.titleEs = input.titleEs.trim();
    item.itemType = input.itemType;
    return item;
  });
}

export async function deleteItem(itemId: string) {
  const user = await requireUser();
  assertDistrict(user);
  mutateState((state) => {
    state.grades = state.grades.filter((g) => g.templateItemId !== itemId);
    state.items = state.items.filter((i) => i.id !== itemId);
  });
}

export async function moveItem(itemId: string, direction: "up" | "down") {
  const user = await requireUser();
  assertDistrict(user);
  mutateState((state) => {
    const item = state.items.find((i) => i.id === itemId);
    if (!item) return;
    const siblings = state.items
      .filter((i) => i.sectionId === item.sectionId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const index = siblings.findIndex((i) => i.id === itemId);
    const swapWith = direction === "up" ? siblings[index - 1] : siblings[index + 1];
    if (!swapWith) return;
    const tmp = item.sortOrder;
    item.sortOrder = swapWith.sortOrder;
    swapWith.sortOrder = tmp;
  });
}

export async function listStudents(siteId: string) {
  const user = await requireUser();
  assertSiteView(user, siteId);
  const state = loadState();
  return state.students
    .filter((s) => s.siteId === siteId)
    .sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`),
    );
}

export async function createStudent(
  siteId: string,
  input: Omit<Student, "id" | "siteId">,
) {
  const user = await requireUser();
  assertSiteAdmin(user, siteId);
  return mutateState((state) => {
    const student: Student = {
      id: id(),
      siteId,
      studentNumber: input.studentNumber.trim(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      preferredName: input.preferredName.trim() || input.firstName.trim(),
      gradeLevelId: input.gradeLevelId,
      homeLanguage: input.homeLanguage,
    };
    state.students.push(student);
    return student;
  });
}

export async function updateStudent(
  studentId: string,
  input: Omit<Student, "id" | "siteId">,
) {
  const user = await requireUser();
  const state = loadState();
  const existing = state.students.find((s) => s.id === studentId);
  if (!existing) throw new Error("Student not found.");
  assertSiteAdmin(user, existing.siteId);
  return mutateState((s) => {
    const student = s.students.find((x) => x.id === studentId)!;
    student.studentNumber = input.studentNumber.trim();
    student.firstName = input.firstName.trim();
    student.lastName = input.lastName.trim();
    student.preferredName = input.preferredName.trim() || input.firstName.trim();
    student.gradeLevelId = input.gradeLevelId;
    student.homeLanguage = input.homeLanguage;
    return student;
  });
}

export async function listStaff(siteId: string) {
  const user = await requireUser();
  assertSiteView(user, siteId);
  const state = loadState();
  return state.memberships
    .filter((m) => m.siteId === siteId)
    .map((m) => {
      const profile = state.profiles.find((p) => p.id === m.profileId);
      return profile ? { ...m, profile } : null;
    })
    .filter((row): row is { id: string; profileId: string; siteId: string; role: SiteRole; profile: Profile } =>
      Boolean(row),
    )
    .sort((a, b) => a.profile.fullName.localeCompare(b.profile.fullName));
}

export async function addStaff(
  siteId: string,
  input: { fullName: string; email: string; role: SiteRole },
) {
  const user = await requireUser();
  if (!user.isSystemAdmin) assertSiteAdmin(user, siteId);
  return mutateState((state) => {
    const email = input.email.trim().toLowerCase();
    let profile = state.profiles.find((p) => p.email.toLowerCase() === email);
    if (!profile) {
      profile = {
        id: id(),
        email,
        fullName: input.fullName.trim(),
        isSystemAdmin: false,
        password: "demo",
      };
      state.profiles.push(profile);
    }
    const existing = state.memberships.find(
      (m) => m.profileId === profile!.id && m.siteId === siteId,
    );
    if (existing) {
      existing.role = input.role;
      return { ...existing, profile };
    }
    const membership = {
      id: id(),
      profileId: profile.id,
      siteId,
      role: input.role,
    };
    state.memberships.push(membership);
    return { ...membership, profile };
  });
}

export async function listCourses(siteId: string) {
  const user = await requireUser();
  assertSiteView(user, siteId);
  const state = loadState();
  const courses = user.isSystemAdmin || user.memberships.some((m) => m.siteId === siteId && m.role === "site_admin")
    ? state.courses.filter((c) => c.siteId === siteId)
    : state.courses.filter(
        (c) =>
          c.siteId === siteId &&
          state.courseTeachers.some((t) => t.courseId === c.id && t.profileId === user.id),
      );
  return courses
    .map((c) => hydrateCourse(state, c.id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
}

export async function myCourses() {
  const user = await requireUser();
  const state = loadState();
  const courseIds = new Set(
    user.isSystemAdmin
      ? state.courses.map((c) => c.id)
      : [
          ...state.courses
            .filter((c) =>
              user.memberships.some(
                (m) => m.siteId === c.siteId && m.role === "site_admin",
              ),
            )
            .map((c) => c.id),
          ...state.courseTeachers
            .filter((t) => t.profileId === user.id)
            .map((t) => t.courseId),
        ],
  );
  return [...courseIds]
    .map((cid) => hydrateCourse(state, cid))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
}

export async function getCourse(courseId: string) {
  const user = await requireUser();
  const state = loadState();
  const course = hydrateCourse(state, courseId);
  if (!course || !canViewCourse(user, state, courseId)) notFound();
  return course;
}

export async function createCourse(
  siteId: string,
  input: { name: string; academicYearId: string; gradeLevelId: string },
) {
  const user = await requireUser();
  assertSiteAdmin(user, siteId);
  return mutateState((state) => {
    const template = findTemplateForGrade(
      state,
      input.academicYearId,
      input.gradeLevelId,
    );
    if (!template) {
      throw new Error(
        "District has not published a report card for this grade and year. Ask the district office to assign a template.",
      );
    }
    const course: Course = {
      id: id(),
      siteId,
      name: input.name.trim(),
      academicYearId: input.academicYearId,
      gradeLevelId: input.gradeLevelId,
      templateId: template.id,
    };
    state.courses.push(course);
    return hydrateCourse(state, course.id)!;
  });
}

export async function setEnrollments(courseId: string, studentIds: string[]) {
  const user = await requireUser();
  const state = loadState();
  const course = state.courses.find((c) => c.id === courseId);
  if (!course) throw new Error("Course not found.");
  assertSiteAdmin(user, course.siteId);
  mutateState((s) => {
    const keep = new Set(studentIds);
    s.enrollments = s.enrollments.filter((e) => {
      if (e.courseId !== courseId) return true;
      if (keep.has(e.studentId)) return true;
      s.grades = s.grades.filter((g) => g.enrollmentId !== e.id);
      return false;
    });
    const existing = new Set(
      s.enrollments.filter((e) => e.courseId === courseId).map((e) => e.studentId),
    );
    for (const studentId of studentIds) {
      if (existing.has(studentId)) continue;
      const student = s.students.find((st) => st.id === studentId);
      if (!student || student.siteId !== course.siteId) continue;
      s.enrollments.push({ id: id(), courseId, studentId });
    }
  });
}

export async function setCourseTeachers(
  courseId: string,
  teachers: { profileId: string; canGrade: boolean; canPrint: boolean }[],
) {
  const user = await requireUser();
  const state = loadState();
  const course = state.courses.find((c) => c.id === courseId);
  if (!course) throw new Error("Course not found.");
  assertSiteAdmin(user, course.siteId);
  mutateState((s) => {
    s.courseTeachers = s.courseTeachers.filter((t) => t.courseId !== courseId);
    for (const teacher of teachers) {
      s.courseTeachers.push({
        id: id(),
        courseId,
        profileId: teacher.profileId,
        canGrade: teacher.canGrade,
        canPrint: teacher.canPrint,
      });
    }
  });
}

export async function getGradebook(courseId: string, termId?: string) {
  const user = await requireUser();
  const state = loadState();
  const course = hydrateCourse(state, courseId);
  if (!course || !canViewCourse(user, state, courseId)) notFound();
  const terms = state.terms
    .filter((t) => t.academicYearId === course.academicYearId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const term =
    terms.find((t) => t.id === termId) ??
    terms[0] ??
    ({
      id: "none",
      academicYearId: course.academicYearId,
      sortOrder: 1,
      nameEn: "Term",
      nameEs: "Periodo",
      startDate: course.year.startDate,
      endDate: course.year.endDate,
    } satisfies Term);
  const enrollmentIds = new Set(course.enrollments.map((e) => e.id));
  return {
    course,
    term,
    terms,
    canEdit: canEditCourse(user, state, courseId),
    canPrint: canPrintCourse(user, state, courseId),
    students: course.enrollments.map((e) => e.student),
    grades: state.grades.filter(
      (g) => g.termId === term.id && enrollmentIds.has(g.enrollmentId),
    ),
  };
}

export async function upsertGrade(input: {
  enrollmentId: string;
  termId: string;
  templateItemId: string;
  markId: string | null;
  comment: string;
}) {
  const user = await requireUser();
  return mutateState((state) => {
    const enrollment = state.enrollments.find((e) => e.id === input.enrollmentId);
    if (!enrollment) throw new Error("Enrollment not found.");
    if (!canEditCourse(user, state, enrollment.courseId)) {
      throw new Error("You cannot change grades in this course.");
    }
    const existing = state.grades.find(
      (g) =>
        g.enrollmentId === input.enrollmentId &&
        g.termId === input.termId &&
        g.templateItemId === input.templateItemId,
    );
    if (existing) {
      existing.markId = input.markId;
      existing.comment = input.comment;
      return existing;
    }
    const grade: Grade = {
      id: id(),
      enrollmentId: input.enrollmentId,
      termId: input.termId,
      templateItemId: input.templateItemId,
      markId: input.markId,
      comment: input.comment,
    };
    state.grades.push(grade);
    return grade;
  });
}

export async function getReportCard(input: {
  courseId: string;
  studentId: string;
  termId: string;
  locale: Locale;
}) {
  const book = await getGradebook(input.courseId, input.termId);
  if (!book.canPrint) throw new Error("You cannot print report cards for this course.");
  const enrollment = book.course.enrollments.find((e) => e.studentId === input.studentId);
  if (!enrollment) throw new Error("Student is not in this course.");
  return {
    locale: input.locale,
    course: book.course,
    term: book.term,
    student: enrollment.student,
    grades: book.grades.filter((g) => g.enrollmentId === enrollment.id),
  };
}

export async function districtOverview() {
  const user = await requireUser();
  assertDistrict(user);
  const state = loadState();
  return {
    siteCount: state.sites.length,
    yearCount: state.years.length,
    templateCount: state.templates.length,
    publishedCount: state.templates.filter((t) => t.status === "published").length,
    studentCount: state.students.length,
    courseCount: state.courses.length,
    years: state.years,
    templates: state.templates,
    sites: state.sites,
  };
}

export async function siteOverview(siteId: string) {
  const user = await requireUser();
  assertSiteView(user, siteId);
  const state = loadState();
  const site = state.sites.find((s) => s.id === siteId);
  if (!site) throw new Error("School not found.");
  const students = state.students.filter((s) => s.siteId === siteId);
  const allCourses = state.courses.filter((c) => c.siteId === siteId);
  const isAdmin =
    user.isSystemAdmin ||
    user.memberships.some((m) => m.siteId === siteId && m.role === "site_admin");
  const courses = isAdmin
    ? allCourses
    : allCourses.filter((c) =>
        state.courseTeachers.some((t) => t.courseId === c.id && t.profileId === user.id),
      );
  const staff = state.memberships.filter((m) => m.siteId === siteId);
  return {
    site,
    studentCount: students.length,
    courseCount: allCourses.length,
    teacherCount: staff.filter((m) => m.role === "teacher").length,
    adminCount: staff.filter((m) => m.role === "site_admin").length,
    courses: courses
      .map((c) => hydrateCourse(state, c.id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c)),
  };
}

export async function resetDemoData() {
  const user = await requireUser();
  assertDistrict(user);
  resetState();
}

export async function findPublishedTemplate(yearId: string, gradeLevelId: string) {
  await requireUser();
  return findTemplateForGrade(loadState(), yearId, gradeLevelId) ?? null;
}
