import { renderToBuffer } from "@react-pdf/renderer";
import { getGradebook, getReportCard } from "@/lib/data/repo";
import { ReportCardDocument, type ReportCardInput } from "@/lib/pdf/report-card";
import type { Locale } from "@/lib/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId");
  const termId = url.searchParams.get("termId");
  const studentId = url.searchParams.get("studentId");
  const locale = (url.searchParams.get("locale") === "es" ? "es" : "en") as Locale;

  if (!courseId || !termId) {
    return new Response("courseId and termId are required", { status: 400 });
  }

  try {
    const cards: ReportCardInput[] = [];
    if (studentId) {
      cards.push(await getReportCard({ courseId, studentId, termId, locale }));
    } else {
      const book = await getGradebook(courseId, termId);
      if (!book.canPrint) {
        return new Response("You cannot print this class.", { status: 403 });
      }
      for (const enrollment of book.course.enrollments) {
        cards.push({
          locale,
          course: book.course,
          term: book.term,
          student: enrollment.student,
          grades: book.grades.filter((g) => g.enrollmentId === enrollment.id),
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
    const message = error instanceof Error ? error.message : "Could not build PDF.";
    return new Response(message, { status: 400 });
  }
}
