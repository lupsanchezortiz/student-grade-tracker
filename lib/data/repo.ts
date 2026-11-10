import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/auth/config";
import {
  assertDistrict,
  assertSiteAdmin,
  assertSiteView,
  canEditCourse,
  canEditCourseItem,
  canImportAttendance,
  canPrintCourse,
  canViewCourse,
  editableItemIdsForCourse,
} from "@/lib/data/access";
import { findTemplateForGrade, hydrateCourse, hydrateTemplate } from "@/lib/data/hydrate";
import { defaultLayout, normalizeLayout } from "@/lib/data/layout";
import { parseLocale, pairItemIds, siblingTemplates } from "@/lib/data/template-doc";
import {
  buildTerms,
  parseTermStructure,
  siteTermStructure,
  termsForSiteYear,
  termStructureName,
} from "@/lib/data/terms";
import { normalizePrintCode } from "@/lib/documents/print-code";
import { sanitizeTemplateHtml } from "@/lib/documents/sanitize";
import type { TemplateLayout } from "@/lib/types";
import { loadState, mutateState, resetState } from "@/lib/data/store";
import {
  listStudentsSupabase,
  createStudentSupabase,
  updateStudentSupabase,
  listStaffSupabase,
  addStaffSupabase,
  listCoursesSupabase,
  createCourseSupabase,
  setEnrollmentsSupabase,
  setCourseTeachersSupabase,
  getCourseTeachersSupabase,
  getStudentByIdSupabase,
  getCourseSupabase,
} from "@/lib/data/supabase-repo";
import type {
  AcademicYear,
  AttendanceRecord,
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
  SectionGradedBy,
  TemplateItem,
  TemplateSection,
  Term,
  TermStructure,
  StoreState,
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
  return { year, terms: [] };
}

export async function listYearSiteCalendars(yearId: string) {
  const user = await requireUser();
  assertDistrict(user);
  const state = loadState();
  const year = state.years.find((y) => y.id === yearId);
  if (!year) throw new Error("School year not found.");
  return state.sites
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((site) => ({
      site,
      terms: termsForSiteYear(state, site.id, yearId),
      termStructure: siteTermStructure(state, site.id, yearId),
    }));
}

export async function listSiteYears(siteId: string) {
  const user = await requireUser();
  assertSiteView(user, siteId);
  const state = loadState();
  return state.years
    .slice()
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .map((year) => {
      const terms = termsForSiteYear(state, siteId, year.id);
      return {
        year,
        terms,
        termStructure: siteTermStructure(state, siteId, year.id),
      };
    });
}

export async function getSiteYear(siteId: string, yearId: string) {
  const user = await requireUser();
  assertSiteView(user, siteId);
  const state = loadState();
  const year = state.years.find((y) => y.id === yearId);
  if (!year) throw new Error("School year not found.");
  return {
    year,
    terms: termsForSiteYear(state, siteId, yearId),
    termStructure: siteTermStructure(state, siteId, yearId),
    canEdit: canImportAttendance(user, siteId),
  };
}

export async function createYear(input: {
  name: string;
  startDate: string;
  endDate: string;
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
    };
    state.years.push(year);
    return year;
  });
}

export async function createSiteTerms(
  siteId: string,
  yearId: string,
  structure: TermStructure,
) {
  const user = await requireUser();
  assertSiteAdmin(user, siteId);
  return mutateState((state) => {
    const year = state.years.find((y) => y.id === yearId);
    if (!year) throw new Error("School year not found.");
    const existing = termsForSiteYear(state, siteId, yearId);
    if (existing.length > 0) {
      const used = termIdsHaveMarks(state, existing.map((term) => term.id));
      if (used) {
        throw new Error("This school already has marks on these terms. Dates and names can still be edited.");
      }
      state.terms = state.terms.filter((term) => !existing.includes(term));
    }
    for (const term of buildTerms(year.id, siteId, structure, year.startDate, year.endDate)) {
      state.terms.push({ ...term, id: id() });
    }
    return termsForSiteYear(state, siteId, yearId);
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
  return mutateState((state) => {
    const term = state.terms.find((t) => t.id === termId);
    if (!term) throw new Error("Term not found.");
    assertSiteAdmin(user, term.siteId);
    term.nameEn = input.nameEn.trim();
    term.nameEs = input.nameEs.trim();
    term.startDate = input.startDate;
    term.endDate = input.endDate;
    return term;
  });
}

function termIdsHaveMarks(state: StoreState, termIds: string[]) {
  const ids = new Set(termIds);
  return (
    state.grades.some((grade) => ids.has(grade.termId)) ||
    (state.attendance ?? []).some((row) => ids.has(row.termId))
  );
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

export async function updateScale(
  scaleId: string,
  input: {
    name: string;
    marks: {
      id?: string;
      code: string;
      labelEn: string;
      labelEs: string;
      sortOrder: number;
      isPassing: boolean;
    }[];
  },
) {
  const user = await requireUser();
  assertDistrict(user);
  if (!input.name.trim() || input.marks.length === 0) {
    throw new Error("A scale needs a name and at least one mark.");
  }
  return mutateState((state) => {
    const scale = state.scales.find((s) => s.id === scaleId);
    if (!scale) throw new Error("Scale not found.");
    scale.name = input.name.trim();
    const kept = new Set<string>();
    for (const mark of input.marks) {
      const existing = mark.id ? state.marks.find((m) => m.id === mark.id && m.scaleId === scaleId) : undefined;
      if (existing) {
        existing.code = mark.code.trim();
        existing.labelEn = mark.labelEn.trim();
        existing.labelEs = mark.labelEs.trim();
        existing.sortOrder = mark.sortOrder;
        existing.isPassing = mark.isPassing;
        kept.add(existing.id);
        continue;
      }
      const created = {
        id: id(),
        scaleId,
        code: mark.code.trim(),
        labelEn: mark.labelEn.trim(),
        labelEs: mark.labelEs.trim(),
        sortOrder: mark.sortOrder,
        isPassing: mark.isPassing,
      };
      state.marks.push(created);
      kept.add(created.id);
    }
    const unused = state.marks.filter((m) => m.scaleId === scaleId && !kept.has(m.id));
    for (const mark of unused) {
      const inUse = state.grades.some((g) => g.markId === mark.id);
      if (inUse) {
        throw new Error(
          `Cannot remove mark ${mark.code}. It is already used on a report card.`,
        );
      }
    }
    state.marks = state.marks.filter((m) => m.scaleId !== scaleId || kept.has(m.id));
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
        termStructure: t.termStructure,
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
  termStructure: TermStructure;
  gradeLevelIds: string[];
  locale?: Locale;
}) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const template = {
      id: id(),
      name: input.name.trim(),
      termStructure: parseTermStructure(input.termStructure),
      status: "draft" as const,
      layout: defaultLayout(),
      locale: parseLocale(input.locale ?? "en"),
      html: "",
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
    termStructure: TermStructure;
    gradeLevelIds: string[];
    locale?: Locale;
  },
) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const template = state.templates.find((t) => t.id === templateId);
    if (!template) throw new Error("Template not found.");
    const nextStructure = parseTermStructure(input.termStructure);
    if (template.status === "published" && nextStructure !== template.termStructure) {
      const used = state.courses.some((c) => c.templateId === templateId);
      if (used) {
        throw new Error(
          "This template already has gradebooks. Keep the same grading periods (trimester, semester, or quarter).",
        );
      }
    }
    template.name = input.name.trim();
    template.termStructure = nextStructure;
    if (input.locale) template.locale = parseLocale(input.locale);
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
  input: { titleEn: string; titleEs: string; gradedBy?: SectionGradedBy },
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
      gradedBy: input.gradedBy === "specialist" ? "specialist" : "homeroom",
    };
    state.sections.push(section);
    return section;
  });
}

export async function updateSection(
  sectionId: string,
  input: { titleEn: string; titleEs: string; gradedBy?: SectionGradedBy },
) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const section = state.sections.find((s) => s.id === sectionId);
    if (!section) throw new Error("Section not found.");
    section.titleEn = input.titleEn.trim();
    section.titleEs = input.titleEs.trim();
    if (input.gradedBy) {
      section.gradedBy = input.gradedBy === "specialist" ? "specialist" : "homeroom";
    }
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
    for (const teacher of state.courseTeachers) {
      if (!teacher.sectionIds?.length) continue;
      teacher.sectionIds = teacher.sectionIds.filter((id) => id !== sectionId);
    }
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
  input: {
    titleEn: string;
    titleEs: string;
    itemType: ItemType;
    maxChars?: number;
    printCode?: string;
    gradeScaleId?: string;
  },
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
      maxChars: input.itemType === "comment" ? input.maxChars || 500 : undefined,
      printCode: normalizePrintCode(input.printCode),
      gradeScaleId: input.itemType === "mark" ? input.gradeScaleId || undefined : undefined,
    };
    state.items.push(item);
    return item;
  });
}

export async function updateItem(
  itemId: string,
  input: {
    titleEn: string;
    titleEs: string;
    itemType: ItemType;
    maxChars?: number;
    printCode?: string;
    gradeScaleId?: string;
  },
) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const item = state.items.find((i) => i.id === itemId);
    if (!item) throw new Error("Item not found.");
    item.titleEn = input.titleEn.trim();
    item.titleEs = input.titleEs.trim();
    item.itemType = input.itemType;
    item.maxChars = input.itemType === "comment" ? input.maxChars || 500 : undefined;
    item.printCode = normalizePrintCode(input.printCode);
    item.gradeScaleId = input.itemType === "mark" ? input.gradeScaleId || undefined : undefined;
    return item;
  });
}

export async function updateTemplateHtml(templateId: string, html: string) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const template = state.templates.find((t) => t.id === templateId);
    if (!template) throw new Error("Template not found.");
    template.html = sanitizeTemplateHtml(html);
    return hydrateTemplate(state, templateId)!;
  });
}

export async function cloneTemplateLanguage(
  templateId: string,
  input: { locale: Locale; name: string },
) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const source = hydrateTemplate(state, templateId);
    if (!source) throw new Error("Template not found.");
    const locale = parseLocale(input.locale);
    const already = siblingTemplates(state, templateId).some((t) => t.locale === locale);
    if (source.locale === locale || already) {
      throw new Error(`A ${locale === "es" ? "Spanish" : "English"} template already exists for this card.`);
    }
    const template = {
      id: id(),
      name: input.name.trim() || `${source.name} (${locale === "es" ? "español" : "English"})`,
      termStructure: source.termStructure,
      status: "draft" as const,
      layout: structuredClone(source.layout),
      locale,
      html: "",
      sourceTemplateId: source.sourceTemplateId ?? source.id,
    };
    state.templates.push(template);
    for (const gradeLevelId of source.gradeLevelIds) {
      state.templateGradeLevels.push({ templateId: template.id, gradeLevelId });
    }
    for (const section of source.sections) {
      const sectionId = id();
      state.sections.push({
        id: sectionId,
        templateId: template.id,
        sortOrder: section.sortOrder,
        titleEn: section.titleEn,
        titleEs: section.titleEs,
        gradedBy: section.gradedBy === "specialist" ? "specialist" : "homeroom",
      });
      for (const item of section.items) {
        state.items.push({
          id: id(),
          sectionId,
          sortOrder: item.sortOrder,
          titleEn: item.titleEn,
          titleEs: item.titleEs,
          itemType: item.itemType,
          maxChars: item.maxChars,
          printCode: normalizePrintCode(item.printCode),
          gradeScaleId: item.gradeScaleId,
        });
      }
    }
    return hydrateTemplate(state, template.id)!;
  });
}

export async function listPrintDocuments(courseId: string) {
  const course = await getCourse(courseId);
  const state = loadState();
  const attached = course.template;
  const extras = siblingTemplates(state, attached.id)
    .filter((t) => t.status === "published")
    .map((t) => hydrateTemplate(state, t.id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  const byLocale = new Map<Locale, typeof attached>();
  byLocale.set(attached.locale, attached);
  for (const extra of extras) {
    if (!byLocale.has(extra.locale)) byLocale.set(extra.locale, extra);
  }
  return [...byLocale.values()];
}

export async function updateTemplateLayout(templateId: string, layout: TemplateLayout) {
  const user = await requireUser();
  assertDistrict(user);
  return mutateState((state) => {
    const template = state.templates.find((t) => t.id === templateId);
    if (!template) throw new Error("Template not found.");
    template.layout = normalizeLayout(layout);
    return hydrateTemplate(state, templateId)!;
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
  
  if (isSupabaseConfigured()) {
    return listStudentsSupabase(siteId);
  }
  
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
  
  if (isSupabaseConfigured()) {
    return createStudentSupabase(siteId, input);
  }
  
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
  
  if (isSupabaseConfigured()) {
    const existing = await getStudentByIdSupabase(studentId);
    if (!existing) throw new Error("Student not found.");
    assertSiteAdmin(user, existing.siteId);
    return updateStudentSupabase(studentId, input);
  }
  
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
  
  if (isSupabaseConfigured()) {
    return listStaffSupabase(siteId);
  }
  
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
  
  if (isSupabaseConfigured()) {
    return addStaffSupabase(siteId, input);
  }
  
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
  
  if (isSupabaseConfigured()) {
    const courseIds = await listCoursesSupabase(siteId);
    const isAdmin = user.isSystemAdmin || user.memberships.some((m) => m.siteId === siteId && m.role === "site_admin");
    
    const filtered: string[] = [];
    if (isAdmin) {
      filtered.push(...courseIds);
    } else {
      for (const courseId of courseIds) {
        const teachers = await getCourseTeachersSupabase(courseId);
        if (teachers.some((t) => t.profileId === user.id)) {
          filtered.push(courseId);
        }
      }
    }
    
    return filtered
      .map((cid) => hydrateCourse(state, cid))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  }
  
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

export async function listDistrictCourses() {
  const user = await requireUser();
  assertDistrict(user);
  return myCourses();
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
  const state = loadState();
  
  const structure = siteTermStructure(state, siteId, input.academicYearId);
  if (!structure) {
    throw new Error("Set this school's terms for that year before opening a course.");
  }
  const template = findTemplateForGrade(
    state,
    input.academicYearId,
    input.gradeLevelId,
    structure,
  );
  if (!template) {
    const periods = termStructureName(structure).toLowerCase();
    throw new Error(
      `District has not published a ${periods} report card for this grade. The card's grading periods must match this school's terms.`,
    );
  }
  
  if (isSupabaseConfigured()) {
    const course = await createCourseSupabase(siteId, {
      name: input.name,
      academicYearId: input.academicYearId,
      gradeLevelId: input.gradeLevelId,
      templateId: template.id,
    });
    return hydrateCourse(state, course.id)!;
  }
  
  return mutateState((state) => {
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
  
  if (isSupabaseConfigured()) {
    const course = await getCourseSupabase(courseId);
    if (!course) throw new Error("Course not found.");
    assertSiteAdmin(user, course.siteId);
    await setEnrollmentsSupabase(courseId, studentIds);
    return;
  }
  
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
  teachers: {
    profileId: string;
    canGrade: boolean;
    canPrint: boolean;
    gradesHomeroom?: boolean;
    sectionIds?: string[];
  }[],
) {
  const user = await requireUser();
  const state = loadState();
  
  if (isSupabaseConfigured()) {
    const course = await getCourseSupabase(courseId);
    if (!course) throw new Error("Course not found.");
    assertSiteAdmin(user, course.siteId);
    const templateSectionIds = new Set(
      state.sections.filter((s) => s.templateId === course.templateId).map((s) => s.id),
    );
    const processedTeachers = teachers.map((t) => ({
      ...t,
      sectionIds: (t.sectionIds ?? []).filter((id) => templateSectionIds.has(id)),
    }));
    await setCourseTeachersSupabase(courseId, processedTeachers);
    return;
  }
  
  const course = state.courses.find((c) => c.id === courseId);
  if (!course) throw new Error("Course not found.");
  assertSiteAdmin(user, course.siteId);
  const templateSectionIds = new Set(
    state.sections.filter((s) => s.templateId === course.templateId).map((s) => s.id),
  );
  mutateState((s) => {
    s.courseTeachers = s.courseTeachers.filter((t) => t.courseId !== courseId);
    for (const teacher of teachers) {
      const sectionIds = (teacher.sectionIds ?? []).filter((id) => templateSectionIds.has(id));
      const gradesHomeroom =
        teacher.gradesHomeroom ?? (teacher.canGrade && sectionIds.length === 0);
      s.courseTeachers.push({
        id: id(),
        courseId,
        profileId: teacher.profileId,
        canGrade: teacher.canGrade,
        canPrint: teacher.canPrint,
        gradesHomeroom,
        sectionIds,
      });
    }
  });
}

export async function getGradebook(courseId: string, termId?: string) {
  const user = await requireUser();
  const state = loadState();
  const course = hydrateCourse(state, courseId);
  if (!course || !canViewCourse(user, state, courseId)) notFound();
  const terms = termsForSiteYear(state, course.siteId, course.academicYearId);
  const term =
    terms.find((t) => t.id === termId) ??
    terms[0] ??
    ({
      id: "none",
      academicYearId: course.academicYearId,
      siteId: course.siteId,
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
    canImportAttendance: canImportAttendance(user, course.siteId),
    editableItemIds: editableItemIdsForCourse(user, state, courseId),
    students: course.enrollments.map((e) => e.student),
    grades: state.grades.filter(
      (g) => g.termId === term.id && enrollmentIds.has(g.enrollmentId),
    ),
    attendance: (state.attendance ?? []).filter(
      (a) => a.termId === term.id && enrollmentIds.has(a.enrollmentId),
    ),
  };
}

export async function upsertAttendance(input: {
  enrollmentId: string;
  termId: string;
  absences: number;
  tardies: number;
}) {
  const user = await requireUser();
  return mutateState((state) => {
    const enrollment = state.enrollments.find((e) => e.id === input.enrollmentId);
    if (!enrollment) throw new Error("Enrollment not found.");
    const course = state.courses.find((c) => c.id === enrollment.courseId);
    if (!course) throw new Error("Course not found.");
    assertSiteAdmin(user, course.siteId);
    if (!state.attendance) state.attendance = [];
    const absences = Math.max(0, Math.round(input.absences) || 0);
    const tardies = Math.max(0, Math.round(input.tardies) || 0);
    const existing = state.attendance.find(
      (a) => a.enrollmentId === input.enrollmentId && a.termId === input.termId,
    );
    if (existing) {
      existing.absences = absences;
      existing.tardies = tardies;
      return existing;
    }
    const row: AttendanceRecord = {
      id: id(),
      enrollmentId: input.enrollmentId,
      termId: input.termId,
      absences,
      tardies,
    };
    state.attendance.push(row);
    return row;
  });
}

export async function resolvePrintTemplate(courseId: string, printTemplateId?: string | null) {
  const documents = await listPrintDocuments(courseId);
  if (printTemplateId) {
    const match = documents.find((t) => t.id === printTemplateId);
    if (match) return match;
  }
  const course = await getCourse(courseId);
  return documents.find((t) => t.id === course.templateId) ?? documents[0] ?? course.template;
}

function courseForPrintDocument(
  course: Awaited<ReturnType<typeof getCourse>>,
  document: NonNullable<ReturnType<typeof hydrateTemplate>>,
  grades: Grade[],
) {
  if (document.id === course.template.id) {
    return { course, grades, locale: document.locale };
  }
  const { courseToDocument } = pairItemIds(course.template, document);
  return {
    course: { ...course, template: document },
    grades: grades.map((g) => ({
      ...g,
      templateItemId: courseToDocument.get(g.templateItemId) ?? g.templateItemId,
    })),
    locale: document.locale,
  };
}

export async function getPrintCards(input: {
  courseId: string;
  termId?: string;
  studentId?: string;
  locale: Locale;
  printTemplateId?: string;
}) {
  const book = await getGradebook(input.courseId, input.termId);
  if (!book.canPrint) throw new Error("You cannot print report cards for this course.");
  const state = loadState();
  const enrollmentIds = new Set(book.course.enrollments.map((e) => e.id));
  const yearGrades = state.grades.filter((g) => enrollmentIds.has(g.enrollmentId));
  const yearAttendance = (state.attendance ?? []).filter((a) =>
    enrollmentIds.has(a.enrollmentId),
  );
  const enrollments = input.studentId
    ? book.course.enrollments.filter((e) => e.studentId === input.studentId)
    : book.course.enrollments;
  if (enrollments.length === 0) throw new Error("No students to print.");
  const document = await resolvePrintTemplate(input.courseId, input.printTemplateId);
  return {
    book,
    document,
    terms: book.terms,
    cards: enrollments.map((enrollment) => ({
      locale: document.locale,
      course: book.course,
      term: book.term,
      student: enrollment.student,
      enrollmentId: enrollment.id,
      grades: yearGrades.filter((g) => g.enrollmentId === enrollment.id),
      attendance: yearAttendance.filter((a) => a.enrollmentId === enrollment.id),
    })),
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
    if (!canEditCourseItem(user, state, enrollment.courseId, input.templateItemId)) {
      throw new Error("You cannot change this mark. Specialist columns are entered by the assigned specialist.");
    }
    const item = state.items.find((i) => i.id === input.templateItemId);
    if (item?.itemType === "mark" && input.markId) {
      const mark = state.marks.find((m) => m.id === input.markId);
      if (!mark || (item.gradeScaleId && mark.scaleId !== item.gradeScaleId)) {
        throw new Error("That mark is not allowed for this item.");
      }
    }
    const comment =
      item?.itemType === "comment" && item.maxChars
        ? input.comment.slice(0, item.maxChars)
        : input.comment;
    const existing = state.grades.find(
      (g) =>
        g.enrollmentId === input.enrollmentId &&
        g.termId === input.termId &&
        g.templateItemId === input.templateItemId,
    );
    if (existing) {
      existing.markId = input.markId;
      existing.comment = comment;
      return existing;
    }
    const grade: Grade = {
      id: id(),
      enrollmentId: input.enrollmentId,
      termId: input.termId,
      templateItemId: input.templateItemId,
      markId: input.markId,
      comment,
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
  printTemplateId?: string;
}) {
  const book = await getGradebook(input.courseId, input.termId);
  if (!book.canPrint) throw new Error("You cannot print report cards for this course.");
  const enrollment = book.course.enrollments.find((e) => e.studentId === input.studentId);
  if (!enrollment) throw new Error("Student is not in this course.");
  const document = await resolvePrintTemplate(input.courseId, input.printTemplateId);
  const printed = courseForPrintDocument(
    book.course,
    document,
    book.grades.filter((g) => g.enrollmentId === enrollment.id),
  );
  return {
    locale: printed.locale,
    course: printed.course,
    term: book.term,
    student: enrollment.student,
    grades: printed.grades,
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
