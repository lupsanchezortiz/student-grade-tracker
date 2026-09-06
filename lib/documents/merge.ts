import type {
  AttendanceRecord,
  CourseDetail,
  Grade,
  Locale,
  Student,
  TemplateItem,
  Term,
} from "@/lib/types";
import {
  isNamedPrintCode,
  parsePrintLineNumber,
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

export function hasHtmlTemplate(htmlEn?: string | null): boolean {
  return Boolean(htmlEn && htmlEn.trim());
}

export function htmlForLocale(template: { htmlEn: string; htmlEs: string }, locale: Locale): string {
  if (locale === "es" && template.htmlEs.trim()) return template.htmlEs;
  return template.htmlEn;
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

export function sampleMergeValues(): Record<string, string> {
  const values: Record<string, string> = {
    STUDENT_NAME: "Sofia Alvarez",
    STUDENT_ID: "20260001",
    GRADE: "Kindergarten",
    SCHOOL: "Maple Elementary",
    YEAR: "2026–27",
    TEACHER_NAME: "Priya Shah",
    TEACHER_SIGNATURE: "Priya Shah",
    TEACHER_DATE: "Sep 6, 2026",
    PARENT_SIGNATURE: "",
    PARENT_DATE: "",
    ILP_GOAL_TEXT: "Build letter-sound fluency in small group.",
    FALL_COMMENTS: "Sofia is a joyful classmate and is growing as a reader.",
    WINTER_COMMENTS: "",
    SPRING_COMMENTS: "",
    "1A": "2",
    "2A": "",
    "3A": "",
    "1T": "1",
    "2T": "",
    "3T": "",
  };
  for (let n = 1; n <= 47; n++) {
    const pad = String(n).padStart(2, "0");
    values[`1${pad}`] = n <= 12 ? "3" : "";
    values[`2${pad}`] = "";
    values[`3${pad}`] = "";
  }
  values["147"] = "Practicing uppercase letters daily.";
  return values;
}
