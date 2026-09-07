import { requireUser } from "@/lib/auth/session";
import { assertDistrict, assertSiteAdmin } from "@/lib/data/access";
import { findTemplateForGrade } from "@/lib/data/hydrate";
import { mutateState } from "@/lib/data/store";
import { csvCell, parseCsv, type CsvRow, type ImportResult } from "@/lib/csv/parse";
import type { ImportKind } from "@/lib/csv/samples";
import { normalizePrintCode, printCodesMatch } from "@/lib/documents/print-code";
import type {
  AttendanceRecord,
  Locale,
  SiteRole,
  StoreState,
  Student,
  TemplateItem,
  Term,
} from "@/lib/types";

const id = () => crypto.randomUUID();

function emptyResult(): ImportResult {
  return { created: 0, updated: 0, skipped: 0, errors: [] };
}

function findSite(state: StoreState, code: string) {
  const needle = code.trim().toUpperCase();
  return state.sites.find((s) => s.code.toUpperCase() === needle);
}

function findGrade(state: StoreState, raw: string) {
  const value = raw.trim().toLowerCase().replace(/^grade\s+/, "");
  return state.gradeLevels.find(
    (g) => g.code.toLowerCase() === value || g.nameEn.toLowerCase() === raw.trim().toLowerCase(),
  );
}

function findYear(state: StoreState, raw: string) {
  const compact = raw.trim().replace(/[–—]/g, "-");
  return state.years.find(
    (y) => y.name === raw.trim() || y.name.replace(/[–—]/g, "-") === compact,
  );
}

function localeOf(raw: string): Locale {
  return raw.trim().toLowerCase().startsWith("es") ? "es" : "en";
}

export async function importStudentsCsv(csv: string, lockedSiteId?: string) {
  const user = await requireUser();
  const { rows } = parseCsv(csv);
  return mutateState((state) => {
    const result = emptyResult();
    rows.forEach((row, index) => {
      const rowNo = index + 2;
      const siteCode = csvCell(row, "site_code", "site");
      const site = findSite(state, siteCode);
      if (!site) {
        result.errors.push({ row: rowNo, message: `Unknown school code “${siteCode}”.` });
        result.skipped++;
        return;
      }
      if (lockedSiteId && site.id !== lockedSiteId) {
        result.errors.push({ row: rowNo, message: `Row is for ${site.code}, not this school.` });
        result.skipped++;
        return;
      }
      try {
        if (user.isSystemAdmin) {
          /* ok */
        } else {
          assertSiteAdmin(user, site.id);
        }
      } catch (error) {
        result.errors.push({
          row: rowNo,
          message: error instanceof Error ? error.message : "No permission.",
        });
        result.skipped++;
        return;
      }
      const number = csvCell(row, "student_number", "id");
      const first = csvCell(row, "first_name", "first");
      const last = csvCell(row, "last_name", "last");
      const grade = findGrade(state, csvCell(row, "grade", "grade_level"));
      if (!number || !first || !last || !grade) {
        result.errors.push({
          row: rowNo,
          message: "Need student_number, first_name, last_name, and a valid grade.",
        });
        result.skipped++;
        return;
      }
      const existing = state.students.find(
        (s) => s.siteId === site.id && s.studentNumber === number,
      );
      const next: Omit<Student, "id" | "siteId"> = {
        studentNumber: number,
        firstName: first,
        lastName: last,
        preferredName: csvCell(row, "preferred_name") || first,
        gradeLevelId: grade.id,
        homeLanguage: localeOf(csvCell(row, "home_language", "language")),
      };
      if (existing) {
        Object.assign(existing, next);
        result.updated++;
      } else {
        state.students.push({ id: id(), siteId: site.id, ...next });
        result.created++;
      }
    });
    return result;
  });
}

export async function importStaffCsv(csv: string, lockedSiteId?: string) {
  const user = await requireUser();
  const { rows } = parseCsv(csv);
  return mutateState((state) => {
    const result = emptyResult();
    rows.forEach((row, index) => {
      const rowNo = index + 2;
      const site = findSite(state, csvCell(row, "site_code", "site"));
      if (!site) {
        result.errors.push({ row: rowNo, message: "Unknown school code." });
        result.skipped++;
        return;
      }
      if (lockedSiteId && site.id !== lockedSiteId) {
        result.errors.push({ row: rowNo, message: `Row is for ${site.code}, not this school.` });
        result.skipped++;
        return;
      }
      try {
        if (!user.isSystemAdmin) assertSiteAdmin(user, site.id);
      } catch (error) {
        result.errors.push({
          row: rowNo,
          message: error instanceof Error ? error.message : "No permission.",
        });
        result.skipped++;
        return;
      }
      const email = csvCell(row, "email").toLowerCase();
      const fullName = csvCell(row, "full_name", "name");
      const roleRaw = csvCell(row, "role").toLowerCase();
      const role: SiteRole = roleRaw.includes("admin") ? "site_admin" : "teacher";
      if (!email || !fullName) {
        result.errors.push({ row: rowNo, message: "Need full_name and email." });
        result.skipped++;
        return;
      }
      let profile = state.profiles.find((p) => p.email.toLowerCase() === email);
      if (!profile) {
        profile = {
          id: id(),
          email,
          fullName,
          isSystemAdmin: false,
          password: "demo",
        };
        state.profiles.push(profile);
      } else {
        profile.fullName = fullName;
      }
      const membership = state.memberships.find(
        (m) => m.profileId === profile!.id && m.siteId === site.id,
      );
      if (membership) {
        membership.role = role;
        result.updated++;
      } else {
        state.memberships.push({
          id: id(),
          profileId: profile.id,
          siteId: site.id,
          role,
        });
        result.created++;
      }
    });
    return result;
  });
}

export async function importCoursesCsv(csv: string, lockedSiteId?: string) {
  const user = await requireUser();
  const { rows } = parseCsv(csv);
  return mutateState((state) => {
    const result = emptyResult();
    rows.forEach((row, index) => {
      const rowNo = index + 2;
      const site = findSite(state, csvCell(row, "site_code", "site"));
      const year = findYear(state, csvCell(row, "year", "academic_year"));
      const grade = findGrade(state, csvCell(row, "grade", "grade_level"));
      const name = csvCell(row, "name", "course");
      if (!site || !year || !grade || !name) {
        result.errors.push({
          row: rowNo,
          message: "Need site_code, year, grade, and name.",
        });
        result.skipped++;
        return;
      }
      if (lockedSiteId && site.id !== lockedSiteId) {
        result.errors.push({ row: rowNo, message: `Row is for ${site.code}, not this school.` });
        result.skipped++;
        return;
      }
      try {
        if (!user.isSystemAdmin) assertSiteAdmin(user, site.id);
      } catch (error) {
        result.errors.push({
          row: rowNo,
          message: error instanceof Error ? error.message : "No permission.",
        });
        result.skipped++;
        return;
      }
      const template = findTemplateForGrade(state, year.id, grade.id);
      if (!template) {
        result.errors.push({
          row: rowNo,
          message: `No published report card for ${grade.nameEn} in ${year.name}.`,
        });
        result.skipped++;
        return;
      }
      let course = state.courses.find(
        (c) => c.siteId === site.id && c.academicYearId === year.id && c.name === name,
      );
      if (course) {
        course.gradeLevelId = grade.id;
        course.templateId = template.id;
        result.updated++;
      } else {
        course = {
          id: id(),
          siteId: site.id,
          academicYearId: year.id,
          gradeLevelId: grade.id,
          templateId: template.id,
          name,
        };
        state.courses.push(course);
        result.created++;
      }
      const teacherEmail = csvCell(row, "teacher_email", "teacher").toLowerCase();
      if (teacherEmail) {
        const profile = state.profiles.find((p) => p.email.toLowerCase() === teacherEmail);
        if (!profile) {
          result.errors.push({
            row: rowNo,
            message: `Teacher ${teacherEmail} is not on staff. Import staff first.`,
          });
        } else if (
          !state.courseTeachers.some((t) => t.courseId === course!.id && t.profileId === profile.id)
        ) {
          state.courseTeachers.push({
            id: id(),
            courseId: course.id,
            profileId: profile.id,
            canGrade: true,
            canPrint: true,
          });
        }
      }
    });
    return result;
  });
}

const SCALE_14_MARKS = [
  { code: "1", labelEn: "Beginning", labelEs: "Principiante" },
  { code: "2", labelEn: "Developing", labelEs: "En desarrollo" },
  { code: "3", labelEn: "Proficient", labelEs: "Competente" },
  { code: "4", labelEn: "Exceeds", labelEs: "Sobresaliente" },
];

function ensureScale(state: StoreState, raw: string) {
  const name = raw.trim();
  if (!name) return null;
  const existing = state.scales.find(
    (s) => s.name.toLowerCase() === name.toLowerCase() || (isFourPoint(name) && s.name === "1–4"),
  );
  if (existing) return existing;
  if (!isFourPoint(name)) {
    return state.scales.find((s) => s.name.toLowerCase() === name.toLowerCase()) ?? null;
  }
  const scale = { id: id(), name: "1–4" };
  state.scales.push(scale);
  SCALE_14_MARKS.forEach((mark, i) => {
    state.marks.push({
      id: id(),
      scaleId: scale.id,
      code: mark.code,
      labelEn: mark.labelEn,
      labelEs: mark.labelEs,
      sortOrder: i + 1,
      isPassing: i > 0,
    });
  });
  return scale;
}

function isFourPoint(name: string) {
  const n = name.trim();
  return /^1\s*[-–to]+\s*4$/i.test(n) || /^1\s*,\s*2\s*,\s*3\s*,\s*4$/.test(n);
}

function isSkippedScale(name: string) {
  return /^comments?$/i.test(name.trim());
}

function parseItemType(raw: string): "mark" | "comment" {
  const value = raw.trim().toLowerCase();
  if (value === "c" || value === "comment" || value.includes("comment")) return "comment";
  return "mark";
}

const DEFAULT_SECTION_EN = "Line items";
const DEFAULT_SECTION_ES = "Criterios";

export function applyTemplateItemsImport(
  state: StoreState,
  templateId: string,
  rows: CsvRow[],
): ImportResult {
  const result = emptyResult();
  const template = state.templates.find((t) => t.id === templateId);
  if (!template) {
    result.errors.push({ row: 0, message: "Template not found." });
    return result;
  }
  const sectionIds = () =>
    new Set(state.sections.filter((s) => s.templateId === templateId).map((s) => s.id));

  rows.forEach((row, index) => {
    const rowNo = index + 2;
    const titleEnRaw = csvCell(row, "list_item_eng", "title_en", "item", "title");
    const titleEsRaw = csvCell(row, "list_item_span", "title_es");
    const locale = template.locale === "es" ? "es" : "en";
    const title = locale === "es" ? titleEsRaw || titleEnRaw : titleEnRaw || titleEsRaw;
    if (!title) {
      result.errors.push({
        row: rowNo,
        message: locale === "es" ? "Need list_item_span or title_es." : "Need list_item_eng or title_en.",
      });
      result.skipped++;
      return;
    }
    const titleEn = titleEnRaw || title;
    const titleEs = titleEsRaw || title;
    const sectionEnRaw = csvCell(row, "section_en", "section");
    const sectionEsRaw = csvCell(row, "section_es");
    const sectionEn = sectionEnRaw || (locale === "es" ? sectionEsRaw : "") || DEFAULT_SECTION_EN;
    const sectionEs = sectionEsRaw || (sectionEnRaw ? sectionEn : DEFAULT_SECTION_ES);
    const itemType = parseItemType(csvCell(row, "mark/comment", "type", "item_type"));
    const printCode = normalizePrintCode(csvCell(row, "print_code", "printcode"));
    const maxCharsRaw = csvCell(row, "char", "max_chars", "max_characters");
    const maxChars =
      itemType === "comment" ? (maxCharsRaw ? Number(maxCharsRaw) || 500 : 500) : undefined;

    const ids = sectionIds();
    let existing = printCode
      ? state.items.find((item) => ids.has(item.sectionId) && printCodesMatch(item.printCode, printCode))
      : undefined;

    const sectionName = locale === "es" ? sectionEs : sectionEn;
    let section = state.sections.find((s) => {
      if (s.templateId !== templateId) return false;
      const name = locale === "es" ? s.titleEs : s.titleEn;
      return name.toLowerCase() === sectionName.toLowerCase();
    });

    if (!existing && section) {
      const needle = title.toLowerCase();
      existing = state.items.find((item) => {
        if (item.sectionId !== section!.id) return false;
        const name = locale === "es" ? item.titleEs : item.titleEn;
        return name.toLowerCase() === needle;
      });
    }

    let saved = existing;
    if (existing) {
      existing.titleEn = titleEn;
      existing.titleEs = titleEs || existing.titleEs;
      existing.itemType = itemType;
      existing.maxChars = itemType === "comment" ? maxChars || 500 : undefined;
      if (printCode) existing.printCode = printCode;
      result.updated++;
    } else {
      if (!section) {
        const max = Math.max(
          0,
          ...state.sections.filter((s) => s.templateId === templateId).map((s) => s.sortOrder),
        );
        section = {
          id: id(),
          templateId,
          sortOrder: max + 1,
          titleEn: sectionEn,
          titleEs: sectionEs,
        };
        state.sections.push(section);
      }
      const sort = Math.max(
        0,
        ...state.items.filter((i) => i.sectionId === section!.id).map((i) => i.sortOrder),
      );
      const item: TemplateItem = {
        id: id(),
        sectionId: section.id,
        sortOrder: sort + 1,
        titleEn,
        titleEs,
        itemType,
        maxChars: itemType === "comment" ? maxChars || 500 : undefined,
        printCode,
      };
      state.items.push(item);
      saved = item;
      result.created++;
    }

    const scaleName = csvCell(row, "grade_scale", "scale");
    if (scaleName && itemType === "mark" && !isSkippedScale(scaleName)) {
      const scale = ensureScale(state, scaleName);
      if (scale && saved) saved.gradeScaleId = scale.id;
      else if (!scale) {
        result.errors.push({
          row: rowNo,
          message: `Unknown scale “${scaleName}”. Use 1-4, 1,2,3,4, or an existing scale name.`,
        });
      }
    }
  });
  return result;
}

export async function importTemplateItemsCsv(templateId: string, csv: string) {
  const user = await requireUser();
  assertDistrict(user);
  const { rows } = parseCsv(csv);
  return mutateState((state) => applyTemplateItemsImport(state, templateId, rows));
}

function findTerm(state: StoreState, yearId: string, raw: string): Term | undefined {
  const terms = state.terms.filter((t) => t.academicYearId === yearId);
  const value = raw.trim().toLowerCase();
  if (!value) return undefined;
  const byName = terms.find(
    (t) => t.nameEn.toLowerCase() === value || t.nameEs.toLowerCase() === value,
  );
  if (byName) return byName;
  const digits = value.match(/(\d+)/);
  if (!digits) return undefined;
  const n = Number(digits[1]);
  return terms.find((t) => t.sortOrder === n);
}

function parseCount(raw: string, rowNo: number, field: string, result: ImportResult) {
  const value = raw.trim();
  if (!value) return 0;
  if (!/^\d+$/.test(value)) {
    result.errors.push({ row: rowNo, message: `${field} must be a whole number.` });
    return null;
  }
  return Number(value);
}

export async function importAttendanceCsv(csv: string, lockedSiteId?: string) {
  const user = await requireUser();
  const { rows } = parseCsv(csv);
  return mutateState((state) => {
    const result = emptyResult();
    if (!state.attendance) state.attendance = [];
    rows.forEach((row, index) => {
      const rowNo = index + 2;
      const site = findSite(state, csvCell(row, "site_code", "site"));
      if (!site) {
        result.errors.push({ row: rowNo, message: "Unknown school code." });
        result.skipped++;
        return;
      }
      if (lockedSiteId && site.id !== lockedSiteId) {
        result.errors.push({ row: rowNo, message: `Row is for ${site.code}, not this school.` });
        result.skipped++;
        return;
      }
      try {
        if (!user.isSystemAdmin) assertSiteAdmin(user, site.id);
      } catch (error) {
        result.errors.push({
          row: rowNo,
          message: error instanceof Error ? error.message : "No permission.",
        });
        result.skipped++;
        return;
      }
      const year = findYear(state, csvCell(row, "year", "academic_year"));
      const term = year ? findTerm(state, year.id, csvCell(row, "term", "period")) : undefined;
      const number = csvCell(row, "student_number", "id");
      if (!year || !term || !number) {
        result.errors.push({
          row: rowNo,
          message: "Need student_number, year, and term (1, 2, 3, or Trimester 2).",
        });
        result.skipped++;
        return;
      }
      const student = state.students.find(
        (s) => s.siteId === site.id && s.studentNumber === number,
      );
      if (!student) {
        result.errors.push({
          row: rowNo,
          message: `No student ${number} at ${site.code}. Import the roster first.`,
        });
        result.skipped++;
        return;
      }
      const courseName = csvCell(row, "course", "course_name");
      const enrollments = state.enrollments.filter((enrollment) => {
        if (enrollment.studentId !== student.id) return false;
        const course = state.courses.find((c) => c.id === enrollment.courseId);
        if (!course || course.academicYearId !== year.id) return false;
        if (courseName && course.name.toLowerCase() !== courseName.toLowerCase()) return false;
        return true;
      });
      if (enrollments.length === 0) {
        result.errors.push({
          row: rowNo,
          message: courseName
            ? `Student ${number} is not enrolled in “${courseName}” for ${year.name}.`
            : `Student ${number} is not enrolled in a course for ${year.name}.`,
        });
        result.skipped++;
        return;
      }
      const absences = parseCount(csvCell(row, "absences", "absent"), rowNo, "absences", result);
      const tardies = parseCount(csvCell(row, "tardies", "tardy"), rowNo, "tardies", result);
      if (absences == null || tardies == null) {
        result.skipped++;
        return;
      }
      let created = false;
      for (const enrollment of enrollments) {
        const existing = state.attendance.find(
          (a) => a.enrollmentId === enrollment.id && a.termId === term.id,
        );
        if (existing) {
          existing.absences = absences;
          existing.tardies = tardies;
        } else {
          const next: AttendanceRecord = {
            id: id(),
            enrollmentId: enrollment.id,
            termId: term.id,
            absences,
            tardies,
          };
          state.attendance.push(next);
          created = true;
        }
      }
      if (created) result.created++;
      else result.updated++;
    });
    return result;
  });
}

export async function runImport(kind: ImportKind, csv: string, opts?: { siteId?: string; templateId?: string }) {
  if (kind === "students") return importStudentsCsv(csv, opts?.siteId);
  if (kind === "staff") return importStaffCsv(csv, opts?.siteId);
  if (kind === "courses") return importCoursesCsv(csv, opts?.siteId);
  if (kind === "attendance") return importAttendanceCsv(csv, opts?.siteId);
  if (!opts?.templateId) throw new Error("Template is required for item import.");
  return importTemplateItemsCsv(opts.templateId, csv);
}
