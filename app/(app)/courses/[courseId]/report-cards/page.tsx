import { redirect } from "next/navigation";
import { getCourse } from "@/lib/data/repo";

export default async function ReportCardsRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ term?: string }>;
}) {
  const { courseId } = await params;
  const { term } = await searchParams;
  const course = await getCourse(courseId);
  const q = term ? `?term=${term}` : "";
  redirect(`/sites/${course.siteId}/courses/${course.id}/report-cards${q}`);
}
