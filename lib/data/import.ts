import { requireUser } from "@/lib/auth/session";
import { assertDistrict, assertSiteAdmin } from "@/lib/data/access";
import { findTemplateForGrade } from "@/lib/data/hydrate";
import { mutateState } from "@/lib/data/store";
import { csvCell, parseCsv, type ImportError, type ImportResult } from "@/lib/csv/parse";
import type { ImportKind } from "@/lib/csv/samples";
import type {
  Locale,
  SiteRole,
  StoreState,
  Student,
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
  return /^1\s*[-–to]+\s*4$/i.test(name.trim());
}

export async function importTemplateItemsCsv(templateId: string, csv: string) {
  const user = await requireUser();
  assertDistrict(user);
  const { rows } = parseCsv(csv);
  return mutateState((state) => {
    const result = emptyResult();
    const template = state.templates.find((t) => t.id === templateId);
    if (!template) {
      result.errors.push({ row: 0, message: "Template not found." });
      return result;
    }
    rows.forEach((row, index) => {
      const rowNo = index + 2;
      const sectionEn = csvCell(row, "section_en", "section");
      const titleEn = csvCell(row, "title_en", "item", "title");
      if (!sectionEn || !titleEn) {
        result.errors.push({ row: rowNo, message: "Need section_en and title_en." });
        result.skipped++;
        return;
      }
      const typeRaw = csvCell(row, "type", "item_type").toLowerCase();
      const itemType = typeRaw.includes("comment") ? "comment" : "mark";
      let section = state.sections.find(
        (s) => s.templateId === templateId && s.titleEn.toLowerCase() === sectionEn.toLowerCase(),
      );
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
          titleEs: csvCell(row, "section_es") || sectionEn,
        };
        state.sections.push(section);
      }
      const maxCharsRaw = csvCell(row, "max_chars", "max_characters");
      const maxChars = maxCharsRaw ? Number(maxCharsRaw) : itemType === "comment" ? 500 : undefined;
      const existing = state.items.find(
        (i) => i.sectionId === section!.id && i.titleEn.toLowerCase() === titleEn.toLowerCase(),
      );
      if (existing) {
        existing.titleEs = csvCell(row, "title_es") || existing.titleEs;
        existing.itemType = itemType;
        existing.maxChars = itemType === "comment" ? maxChars || 500 : undefined;
        result.updated++;
      } else {
        const sort = Math.max(
          0,
          ...state.items.filter((i) => i.sectionId === section!.id).map((i) => i.sortOrder),
        );
        state.items.push({
          id: id(),
          sectionId: section.id,
          sortOrder: sort + 1,
          titleEn,
          titleEs: csvCell(row, "title_es") || titleEn,
          itemType,
          maxChars: itemType === "comment" ? maxChars || 500 : undefined,
        });
        result.created++;
      }
      const scaleName = csvCell(row, "scale", "grade_scale");
      if (scaleName && itemType === "mark") {
        const scale = ensureScale(state, scaleName);
        if (scale) template.gradeScaleId = scale.id;
        else {
          result.errors.push({
            row: rowNo,
            message: `Unknown scale “${scaleName}”. Use 1-4 or an existing scale name.`,
          });
        }
      }
    });
    return result;
  });
}

export async function runImport(kind: ImportKind, csv: string, opts?: { siteId?: string; templateId?: string }) {
  if (kind === "students") return importStudentsCsv(csv, opts?.siteId);
  if (kind === "staff") return importStaffCsv(csv, opts?.siteId);
  if (kind === "courses") return importCoursesCsv(csv, opts?.siteId);
  if (!opts?.templateId) throw new Error("Template is required for item import.");
  return importTemplateItemsCsv(opts.templateId, csv);
}
