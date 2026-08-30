import Link from "next/link";
import { notFound } from "next/navigation";
import { GradebookGrid } from "@/components/gradebook/gradebook-grid";
import { PageHeader } from "@/components/page-header";
import { getGradebook } from "@/lib/data/repo";

export default async function SiteGradebookPage({
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

  return (
    <div>
      <PageHeader
        eyebrow={`${book.course.site.name} · ${book.course.year.name}`}
        title={book.course.name}
        description={`${book.course.gradeLevel.nameEn} · ${book.course.template.name}. Students are rows; report-card items are columns.`}
        actions={
          <Link
            href={`/sites/${book.course.siteId}/courses/${book.course.id}`}
            className="text-sm text-primary hover:underline"
          >
            Roster & permissions
          </Link>
        }
      />
      <GradebookGrid book={book} />
    </div>
  );
}
