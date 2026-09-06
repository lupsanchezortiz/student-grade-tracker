import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getGradebook, listPrintDocuments } from "@/lib/data/repo";
import { hasHtmlTemplate, localeLabel } from "@/lib/data/template-doc";
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
  const documents = await listPrintDocuments(courseId);

  function href(printTemplateId: string, studentId?: string) {
    const q = new URLSearchParams({
      courseId,
      termId,
      printTemplateId,
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
          documents.some((d) => hasHtmlTemplate(d.html))
            ? "Each language is its own template. Print uses that document’s HTML and this course’s marks."
            : "Print uses the district template for that language. Add another language from the template editor."
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
          {documents.map((doc) => (
            <Button
              key={doc.id}
              nativeButton={false}
              variant={doc.id === book.course.templateId ? "default" : "outline"}
              render={<a href={href(doc.id)} target="_blank" />}
            >
              {hasHtmlTemplate(doc.html)
                ? `Print class (${localeLabel(doc.locale)})`
                : `Download class (${localeLabel(doc.locale)} PDF)`}
            </Button>
          ))}
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
                  <div className="flex flex-wrap gap-2">
                    {documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={href(doc.id, enrollment.studentId)}
                        target="_blank"
                        className="text-sm text-primary hover:underline"
                      >
                        {hasHtmlTemplate(doc.html)
                          ? localeLabel(doc.locale)
                          : `${localeLabel(doc.locale)} PDF`}
                      </a>
                    ))}
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
