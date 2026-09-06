import { renderToBuffer } from "@react-pdf/renderer";
import {
  getGradebook,
  getPrintCards,
  getReportCard,
  listPrintDocuments,
  resolvePrintTemplate,
} from "@/lib/data/repo";
import { hasHtmlTemplate } from "@/lib/data/template-doc";
import {
  buildMergeValues,
  combinePrintHtml,
  mergeDocument,
} from "@/lib/documents/merge";
import { ReportCardDocument, type ReportCardInput } from "@/lib/pdf/report-card";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId");
  const termId = url.searchParams.get("termId");
  const studentId = url.searchParams.get("studentId") ?? undefined;
  const printTemplateId = url.searchParams.get("printTemplateId") ?? undefined;
  const localeHint = url.searchParams.get("locale");

  if (!courseId || !termId) {
    return new Response("courseId and termId are required", { status: 400 });
  }

  try {
    const preview = await getGradebook(courseId, termId);
    let document = await resolvePrintTemplate(courseId, printTemplateId);
    if (!printTemplateId && localeHint) {
      const docs = await listPrintDocuments(courseId);
      document = docs.find((d) => d.locale === localeHint) ?? document;
    }
    const locale = document.locale;

    if (hasHtmlTemplate(document.html)) {
      const { book, terms, cards } = await getPrintCards({
        courseId,
        termId,
        studentId,
        locale,
        printTemplateId: document.id,
      });
      const items = book.course.template.sections.flatMap((s) => s.items);
      const documents = cards.map((card) =>
        mergeDocument(
          document.html,
          buildMergeValues({
            student: card.student,
            course: book.course,
            terms,
            grades: card.grades,
            attendance: card.attendance,
            items,
            enrollmentId: card.enrollmentId,
            locale,
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
      cards.push(
        await getReportCard({
          courseId,
          studentId,
          termId,
          locale,
          printTemplateId: document.id,
        }),
      );
    } else {
      if (!preview.canPrint) {
        return new Response("You cannot print this class.", { status: 403 });
      }
      for (const enrollment of preview.course.enrollments) {
        cards.push(
          await getReportCard({
            courseId,
            studentId: enrollment.studentId,
            termId,
            locale,
            printTemplateId: document.id,
          }),
        );
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
