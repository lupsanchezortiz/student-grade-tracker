import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { GradebookGrid } from "@/components/gradebook/gradebook-grid";
import { PageHeader } from "@/components/page-header";
import { getGradebook } from "@/lib/data/repo";

export default async function SiteGradebookPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string; courseId: string }>;
  searchParams: Promise<{ term?: string; section?: string }>;
}) {
  const { siteId, courseId } = await params;
  const { term, section } = await searchParams;
  const book = await getGradebook(courseId, term);
  if (book.course.siteId !== siteId) notFound();

  return (
    <div>
      <PageHeader
        eyebrow={`${book.course.site.name} · ${book.course.year.name}`}
        title={book.course.name}
        description={`${book.course.gradeLevel.nameEn} · ${book.course.template.name}. Choose a section to enter marks, or Attendance for absences and tardies imported by a site administrator.`}
        actions={
          <Link
            href={`/sites/${book.course.siteId}/courses/${book.course.id}`}
            className="text-sm text-primary hover:underline"
          >
            Roster & permissions
          </Link>
        }
      />
      {book.terms.length === 0 || book.term.id === "none" ? (
        <EmptyState
          title="Terms are not set for this year"
          description="A site administrator needs to choose semester, trimester, or quarter on the Terms page before this gradebook can open."
          action={
            <Link href={`/sites/${siteId}/terms/${book.course.academicYearId}`} className="text-sm text-primary hover:underline">
              Set terms
            </Link>
          }
        />
      ) : (
        <GradebookGrid key={book.term.id} book={book} initialSectionId={section} />
      )}
    </div>
  );
}
