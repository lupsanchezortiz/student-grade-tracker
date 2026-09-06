import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getGradebook } from "@/lib/data/repo";
import { studentName } from "@/lib/format";

export default async function SiteReportCardsPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string; courseId: string }>;
  searchParams: Promise<{ term?: string }>;
}) {
  const { siteId, courseId } = await params;
  const { term } = await searchParams;
  const book = await getGradebook(courseId, term);
  if (book.course.siteId !== siteId) notFound();
  const termId = book.term.id;

  function href(locale: "en" | "es", studentId?: string) {
    const q = new URLSearchParams({
      courseId,
      termId,
      locale,
    });
    if (studentId) q.set("studentId", studentId);
    return `/api/report-cards?${q.toString()}`;
  }

  return (
    <div>
      <PageHeader
        eyebrow={book.course.name}
        title={`${book.term.nameEn} report cards`}
        description={
          book.course.template.htmlEn.trim()
            ? "This course prints the district HTML document with merge tags filled from the gradebook (all terms)."
            : "Same marks, two languages. English and Spanish cards use the district template labels."
        }
        actions={
          <Link
            href={`/sites/${siteId}/courses/${courseId}/gradebook?term=${termId}`}
            className="text-sm text-primary hover:underline"
          >
            Back to gradebook
          </Link>
        }
      />

      {book.canPrint ? (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button nativeButton={false} render={<a href={href("en")} target="_blank" />}>
            {book.course.template.htmlEn.trim() ? "Print class (English)" : "Download class (English)"}
          </Button>
          <Button
            nativeButton={false}
            variant="outline"
            render={<a href={href("es")} target="_blank" />}
          >
            {book.course.template.htmlEn.trim() ? "Imprimir clase (español)" : "Descargar clase (español)"}
          </Button>
        </div>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          You can view this class but you do not have print permission.
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {book.course.enrollments.length === 0 ? (
            <li className="px-4 py-8 text-sm text-muted-foreground">
              Enroll students before printing cards.
            </li>
          ) : (
            book.course.enrollments.map((enrollment) => (
              <li
                key={enrollment.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{studentName(enrollment.student)}</p>
                  <p className="text-xs text-muted-foreground">
                    {enrollment.student.studentNumber} · home language{" "}
                    {enrollment.student.homeLanguage.toUpperCase()}
                  </p>
                </div>
                {book.canPrint ? (
                  <div className="flex gap-2">
                    <a
                      href={href("en", enrollment.studentId)}
                      target="_blank"
                      className="text-sm text-primary hover:underline"
                    >
                      {book.course.template.htmlEn.trim() ? "English" : "English PDF"}
                    </a>
                    <a
                      href={href("es", enrollment.studentId)}
                      target="_blank"
                      className="text-sm text-primary hover:underline"
                    >
                      {book.course.template.htmlEn.trim() ? "Español" : "PDF en español"}
                    </a>
                  </div>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
