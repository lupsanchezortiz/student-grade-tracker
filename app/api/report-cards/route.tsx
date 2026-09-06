import { renderToBuffer } from "@react-pdf/renderer";
import { getGradebook, getPrintCards, getReportCard } from "@/lib/data/repo";
import {
  buildMergeValues,
  combinePrintHtml,
  hasHtmlTemplate,
  htmlForLocale,
  mergeDocument,
} from "@/lib/documents/merge";
import { ReportCardDocument, type ReportCardInput } from "@/lib/pdf/report-card";
import type { Locale } from "@/lib/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId");
  const termId = url.searchParams.get("termId");
  const studentId = url.searchParams.get("studentId") ?? undefined;
  const locale = (url.searchParams.get("locale") === "es" ? "es" : "en") as Locale;

  if (!courseId || !termId) {
    return new Response("courseId and termId are required", { status: 400 });
  }

  try {
    const preview = await getGradebook(courseId, termId);
    if (hasHtmlTemplate(preview.course.template.htmlEn)) {
      const { book, terms, cards } = await getPrintCards({
        courseId,
        termId,
        studentId,
        locale,
      });
      const source = htmlForLocale(book.course.template, locale);
      const items = book.course.template.sections.flatMap((s) => s.items);
      const documents = cards.map((card) =>
        mergeDocument(
          source,
          buildMergeValues({
            student: card.student,
            course: card.course,
            terms,
            grades: card.grades,
            attendance: card.attendance,
            items,
            enrollmentId: card.enrollmentId,
            locale: card.locale,
          }),
        ),
      );
      const html = combinePrintHtml(documents);
      const who =
        cards.length === 1
          ? `${cards[0].student.lastName}-${cards[0].student.firstName}`
          : book.course.name.replace(/\s+/g, "-");
      const filename = `report-card-${who}-${locale}.html`.replace(/[^\w.-]+/g, "_");
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="${filename}"`,
        },
      });
    }

    const cards: ReportCardInput[] = [];
    if (studentId) {
      cards.push(await getReportCard({ courseId, studentId, termId, locale }));
    } else {
      if (!preview.canPrint) {
        return new Response("You cannot print this class.", { status: 403 });
      }
      for (const enrollment of preview.course.enrollments) {
        cards.push({
          locale,
          course: preview.course,
          term: preview.term,
          student: enrollment.student,
          grades: preview.grades.filter((g) => g.enrollmentId === enrollment.id),
        });
      }
    }

    if (cards.length === 0) {
      return new Response("No students to print.", { status: 400 });
    }

    const buffer = await renderToBuffer(<ReportCardDocument cards={cards} />);
    const first = cards[0];
    const who =
      cards.length === 1
        ? `${first.student.lastName}-${first.student.firstName}`
        : first.course.name.replace(/\s+/g, "-");
    const filename = `report-card-${who}-${first.term.nameEn}-${locale}.pdf`.replace(
      /[^\w.-]+/g,
      "_",
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not build the report card.";
    return new Response(message, { status: 400 });
  }
}
