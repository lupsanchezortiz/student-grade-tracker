import type {
  AttendanceRecord,
  CourseDetail,
  Grade,
  GradeScaleMark,
  Locale,
  Student,
  TemplateDetail,
  TemplateItem,
  Term,
} from "@/lib/types";
import {
  isNamedPrintCode,
  parsePrintLineNumber,
  termCountForStructure,
  termMergeTag,
} from "@/lib/documents/print-code";
import { sanitizeTemplateHtml } from "@/lib/documents/sanitize";

const TAG = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function mergeDocument(html: string, values: Record<string, string>): string {
  const safe = sanitizeTemplateHtml(html);
  return safe.replace(TAG, (_, key: string) => escapeHtml(values[key] ?? ""));
}

/** Preview mode: leave {{101}} visible instead of filling marks. */
export function mergeDocumentShowTags(html: string): string {
  const safe = sanitizeTemplateHtml(html);
  return safe.replace(TAG, (_, key: string) => escapeHtml(`{{${key}}}`));
}

export function hasHtmlTemplate(html?: string | null): boolean {
  return Boolean(html && html.trim());
}

function numericPrintCode(code: string): number | null {
  return parsePrintLineNumber(code);
}

export function buildMergeValues(input: {
  student: Student;
  course: CourseDetail;
  terms: Term[];
  grades: Grade[];
  attendance: AttendanceRecord[];
  items: TemplateItem[];
  enrollmentId: string;
  locale: Locale;
  today?: Date;
}): Record<string, string> {
  const { student, course, terms, grades, attendance, items, enrollmentId, locale } = input;
  const today = input.today ?? new Date();
  const date = today.toLocaleDateString(locale === "es" ? "es-US" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const teacher =
    course.teachers
      .map((t) => t.profile.fullName)
      .filter(Boolean)
      .join(", ") || "";
  const values: Record<string, string> = {
    STUDENT_NAME: [student.preferredName || student.firstName, student.lastName]
      .filter(Boolean)
      .join(" "),
    STUDENT_ID: student.studentNumber,
    GRADE: locale === "es" ? course.gradeLevel.nameEs : course.gradeLevel.nameEn,
    SCHOOL: course.site.name,
    YEAR: course.year.name,
    TEACHER_NAME: teacher,
    TEACHER_SIGNATURE: teacher,
    TEACHER_DATE: date,
    PARENT_SIGNATURE: "",
    PARENT_DATE: "",
    ILP_GOAL_TEXT: "",
    FALL_COMMENTS: "",
    WINTER_COMMENTS: "",
    SPRING_COMMENTS: "",
  };

  const marks = new Map(course.template.marks.map((m) => [m.id, m]));
  const byItemTerm = new Map<string, Grade>();
  for (const grade of grades) {
    if (grade.enrollmentId !== enrollmentId) continue;
    byItemTerm.set(`${grade.templateItemId}:${grade.termId}`, grade);
  }

  for (const item of items) {
    const code = item.printCode?.trim();
    if (!code) continue;
    const named = code.toUpperCase();
    if (isNamedPrintCode(named)) {
      if (named === "ILP_GOAL") {
        const first = terms[0];
        const g = first ? byItemTerm.get(`${item.id}:${first.id}`) : undefined;
        values.ILP_GOAL_TEXT = g?.comment ?? "";
        continue;
      }
      const term = named === "FALL_COMMENTS" ? terms[0] : named === "WINTER_COMMENTS" ? terms[1] : terms[2];
      const g = term ? byItemTerm.get(`${item.id}:${term.id}`) : undefined;
      values[named] = g?.comment ?? "";
      continue;
    }
    const line = numericPrintCode(code);
    if (line == null) continue;
    terms.forEach((term, index) => {
      const g = byItemTerm.get(`${item.id}:${term.id}`);
      const tag = termMergeTag(line, index);
      if (item.itemType === "comment") {
        values[tag] = g?.comment ?? "";
      } else {
        const mark = g?.markId ? marks.get(g.markId) : null;
        values[tag] = mark?.code ?? "";
      }
    });
  }

  terms.forEach((term, index) => {
    const row = attendance.find((a) => a.enrollmentId === enrollmentId && a.termId === term.id);
    const n = index + 1;
    values[`${n}A`] = row ? String(row.absences) : "";
    values[`${n}T`] = row ? String(row.tardies) : "";
  });

  return values;
}

export function extractStyle(html: string): string {
  const match = html.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i);
  return match ? match[1] : "";
}

export function extractBody(html: string): string {
  const match = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : html;
}

export function combinePrintHtml(documents: string[]): string {
  if (documents.length === 0) return "";
  if (documents.length === 1) return documents[0];
  const style = extractStyle(documents[0]);
  const bodies = documents.map(extractBody).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Report cards</title>
  <style>${style}</style>
</head>
<body>
${bodies}
</body>
</html>`;
}

function sampleMarkCode(template: TemplateDetail, item: TemplateItem): string {
  const scaleId = item.gradeScaleId || template.gradeScaleId || template.scale.id;
  const marks: GradeScaleMark[] =
    (scaleId && template.marksByScaleId[scaleId]) ||
    template.marks.filter((m) => m.scaleId === scaleId);
  const pick =
    marks.find((m) => m.isPassing && m.code.toUpperCase() !== "NYA") ?? marks[0];
  return pick?.code ?? "3";
}

export function sampleMergeValues(template?: TemplateDetail): Record<string, string> {
  const locale = template?.locale ?? "en";
  const terms = template ? termCountForStructure(template.termStructure) : 3;
  const values: Record<string, string> = {
    STUDENT_NAME: locale === "es" ? "Sofía Álvarez" : "Sofia Alvarez",
    STUDENT_ID: "20260001",
    GRADE: locale === "es" ? "Kinder" : "Kindergarten",
    SCHOOL: "Maple Elementary",
    YEAR: "2026–27",
    TEACHER_NAME: "Priya Shah",
    TEACHER_SIGNATURE: "Priya Shah",
    TEACHER_DATE: locale === "es" ? "6 sept 2026" : "Sep 6, 2026",
    PARENT_SIGNATURE: "",
    PARENT_DATE: "",
    ILP_GOAL_TEXT: "Build letter-sound fluency in small group.",
    FALL_COMMENTS: "Sofia is a joyful classmate and is growing as a reader.",
    WINTER_COMMENTS: "",
    SPRING_COMMENTS: "",
  };
  for (let n = 1; n <= terms; n++) {
    values[`${n}A`] = n === 1 ? "2" : "";
    values[`${n}T`] = n === 1 ? "1" : "";
  }

  const items = template?.sections.flatMap((section) => section.items) ?? [];
  if (items.length === 0) {
    for (let n = 1; n <= 47; n++) {
      const pad = String(n).padStart(2, "0");
      values[`1${pad}`] = n <= 12 ? "3" : "";
      for (let term = 2; term <= terms; term++) values[`${term}${pad}`] = "";
    }
    values["147"] = "Practicing uppercase letters daily.";
    return values;
  }

  items.forEach((item, index) => {
    const code = item.printCode?.trim();
    if (!code) return;
    const named = code.toUpperCase();
    if (isNamedPrintCode(named)) {
      if (named === "ILP_GOAL") values.ILP_GOAL_TEXT = "Build letter-sound fluency in small group.";
      if (named === "FALL_COMMENTS") {
        values.FALL_COMMENTS = "Sofia is a joyful classmate and is growing as a reader.";
      }
      return;
    }
    const line = parsePrintLineNumber(code);
    if (line == null) return;
    for (let term = 0; term < terms; term++) {
      const tag = termMergeTag(line, term);
      if (term > 0) {
        values[tag] = "";
        continue;
      }
      values[tag] =
        item.itemType === "comment"
          ? index === 0
            ? "Practicing uppercase letters daily."
            : "Sample comment."
          : sampleMarkCode(template!, item);
    }
  });
  return values;
}
