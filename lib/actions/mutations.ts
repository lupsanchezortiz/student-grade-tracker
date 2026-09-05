"use server";

import { revalidatePath } from "next/cache";
import {
  addItem,
  addSection,
  addStaff,
  createCourse,
  createScale,
  createSite,
  createStudent,
  createTemplate,
  createYear,
  deleteItem,
  deleteSection,
  moveItem,
  moveSection,
  publishTemplate,
  resetDemoData,
  setCourseTeachers,
  setEnrollments,
  updateItem,
  updateSection,
  updateSite,
  updateStudent,
  updateTemplate,
  updateTerm,
  updateTemplateLayout,
  updateYear,
  upsertGrade,
} from "@/lib/data/repo";
import { runImport } from "@/lib/data/import";
import type { ImportKind } from "@/lib/csv/samples";
import type { ItemType, Locale, SiteRole, TemplateLayout, TermStructure } from "@/lib/types";

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function createSiteAction(formData: FormData) {
  await createSite({
    name: str(formData, "name"),
    code: str(formData, "code"),
    address: str(formData, "address"),
  });
  revalidatePath("/district");
}

export async function updateSiteAction(formData: FormData) {
  await updateSite(str(formData, "id"), {
    name: str(formData, "name"),
    code: str(formData, "code"),
    address: str(formData, "address"),
  });
  revalidatePath("/district");
}

export async function createYearAction(formData: FormData) {
  await createYear({
    name: str(formData, "name"),
    startDate: str(formData, "startDate"),
    endDate: str(formData, "endDate"),
    termStructure: str(formData, "termStructure") as TermStructure,
  });
  revalidatePath("/district/years");
}

export async function updateYearAction(formData: FormData) {
  const id = str(formData, "id");
  await updateYear(id, {
    name: str(formData, "name"),
    startDate: str(formData, "startDate"),
    endDate: str(formData, "endDate"),
  });
  revalidatePath(`/district/years/${id}`);
}

export async function updateTermAction(formData: FormData) {
  await updateTerm(str(formData, "id"), {
    nameEn: str(formData, "nameEn"),
    nameEs: str(formData, "nameEs"),
    startDate: str(formData, "startDate"),
    endDate: str(formData, "endDate"),
  });
  revalidatePath("/district/years");
}

export async function createScaleAction(formData: FormData) {
  const codes = formData.getAll("markCode").map(String);
  const labelsEn = formData.getAll("markLabelEn").map(String);
  const labelsEs = formData.getAll("markLabelEs").map(String);
  const passing = formData.getAll("markPassing").map(String);
  await createScale({
    name: str(formData, "name"),
    marks: codes
      .map((code, i) => ({
        code,
        labelEn: labelsEn[i] ?? code,
        labelEs: labelsEs[i] ?? code,
        sortOrder: i + 1,
        isPassing: passing.includes(String(i)),
      }))
      .filter((m) => m.code.trim()),
  });
  revalidatePath("/district/scales");
}

export async function createTemplateAction(formData: FormData) {
  await createTemplate({
    name: str(formData, "name"),
    academicYearId: str(formData, "academicYearId"),
    gradeScaleId: str(formData, "gradeScaleId"),
    gradeLevelIds: formData.getAll("gradeLevelId").map(String),
  });
  revalidatePath("/district/templates");
}

export async function updateTemplateAction(formData: FormData) {
  const id = str(formData, "id");
  await updateTemplate(id, {
    name: str(formData, "name"),
    academicYearId: str(formData, "academicYearId"),
    gradeScaleId: str(formData, "gradeScaleId"),
    gradeLevelIds: formData.getAll("gradeLevelId").map(String),
  });
  revalidatePath(`/district/templates/${id}`);
}

export async function publishTemplateAction(formData: FormData) {
  const id = str(formData, "id");
  await publishTemplate(id);
  revalidatePath(`/district/templates/${id}`);
}

export async function addSectionAction(formData: FormData) {
  const templateId = str(formData, "templateId");
  await addSection(templateId, {
    titleEn: str(formData, "titleEn"),
    titleEs: str(formData, "titleEs"),
  });
  revalidatePath(`/district/templates/${templateId}`);
}

export async function updateSectionAction(formData: FormData) {
  await updateSection(str(formData, "id"), {
    titleEn: str(formData, "titleEn"),
    titleEs: str(formData, "titleEs"),
  });
  revalidatePath("/district/templates");
}

export async function deleteSectionAction(formData: FormData) {
  await deleteSection(str(formData, "id"));
  revalidatePath("/district/templates");
}

export async function moveSectionAction(formData: FormData) {
  await moveSection(str(formData, "id"), str(formData, "direction") as "up" | "down");
  revalidatePath("/district/templates");
}

export async function addItemAction(formData: FormData) {
  const maxChars = Number(str(formData, "maxChars")) || undefined;
  await addItem(str(formData, "sectionId"), {
    titleEn: str(formData, "titleEn"),
    titleEs: str(formData, "titleEs"),
    itemType: str(formData, "itemType") as ItemType,
    maxChars,
  });
  revalidatePath("/district/templates");
}

export async function updateItemAction(formData: FormData) {
  const maxChars = Number(str(formData, "maxChars")) || undefined;
  await updateItem(str(formData, "id"), {
    titleEn: str(formData, "titleEn"),
    titleEs: str(formData, "titleEs"),
    itemType: str(formData, "itemType") as ItemType,
    maxChars,
  });
  revalidatePath("/district/templates");
}

export async function deleteItemAction(formData: FormData) {
  await deleteItem(str(formData, "id"));
  revalidatePath("/district/templates");
}

export async function moveItemAction(formData: FormData) {
  await moveItem(str(formData, "id"), str(formData, "direction") as "up" | "down");
  revalidatePath("/district/templates");
}

export async function createStudentAction(formData: FormData) {
  const siteId = str(formData, "siteId");
  await createStudent(siteId, {
    studentNumber: str(formData, "studentNumber"),
    firstName: str(formData, "firstName"),
    lastName: str(formData, "lastName"),
    preferredName: str(formData, "preferredName"),
    gradeLevelId: str(formData, "gradeLevelId"),
    homeLanguage: str(formData, "homeLanguage") as Locale,
  });
  revalidatePath(`/sites/${siteId}/students`);
}

export async function updateStudentAction(formData: FormData) {
  const siteId = str(formData, "siteId");
  await updateStudent(str(formData, "id"), {
    studentNumber: str(formData, "studentNumber"),
    firstName: str(formData, "firstName"),
    lastName: str(formData, "lastName"),
    preferredName: str(formData, "preferredName"),
    gradeLevelId: str(formData, "gradeLevelId"),
    homeLanguage: str(formData, "homeLanguage") as Locale,
  });
  revalidatePath(`/sites/${siteId}/students`);
}

export async function addStaffAction(formData: FormData) {
  const siteId = str(formData, "siteId");
  await addStaff(siteId, {
    fullName: str(formData, "fullName"),
    email: str(formData, "email"),
    role: str(formData, "role") as SiteRole,
  });
  revalidatePath(`/sites/${siteId}/staff`);
}

export async function createCourseAction(formData: FormData) {
  const siteId = str(formData, "siteId");
  await createCourse(siteId, {
    name: str(formData, "name"),
    academicYearId: str(formData, "academicYearId"),
    gradeLevelId: str(formData, "gradeLevelId"),
  });
  revalidatePath(`/sites/${siteId}/courses`);
}

export async function setEnrollmentsAction(formData: FormData) {
  const courseId = str(formData, "courseId");
  await setEnrollments(courseId, formData.getAll("studentId").map(String));
  revalidatePath(`/sites`);
  revalidatePath("/sites");
  revalidatePath(`/courses/${courseId}/gradebook`);
}

export async function setTeachersAction(formData: FormData) {
  const courseId = str(formData, "courseId");
  const profileIds = formData.getAll("profileId").map(String);
  const canGrade = new Set(formData.getAll("canGrade").map(String));
  const canPrint = new Set(formData.getAll("canPrint").map(String));
  await setCourseTeachers(
    courseId,
    profileIds.map((profileId) => ({
      profileId,
      canGrade: canGrade.has(profileId),
      canPrint: canPrint.has(profileId),
    })),
  );
  revalidatePath(`/sites`);
}

export async function saveGradeAction(input: {
  enrollmentId: string;
  termId: string;
  templateItemId: string;
  markId: string | null;
  comment: string;
}) {
  await upsertGrade(input);
  revalidatePath("/courses");
}

export async function resetDemoAction() {
  await resetDemoData();
  revalidatePath("/");
}

export async function importCsvAction(input: {
  kind: ImportKind;
  csv: string;
  siteId?: string;
  templateId?: string;
}) {
  const result = await runImport(input.kind, input.csv, {
    siteId: input.siteId,
    templateId: input.templateId,
  });
  revalidatePath("/");
  return result;
}

export async function saveTemplateLayoutAction(templateId: string, layout: TemplateLayout) {
  await updateTemplateLayout(templateId, layout);
  revalidatePath(`/district/templates/${templateId}`);
}
