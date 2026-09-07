import { redirect } from "next/navigation";
import { getCourse } from "@/lib/data/repo";

export default async function GradebookRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ term?: string; section?: string }>;
}) {
  const { courseId } = await params;
  const { term, section } = await searchParams;
  const course = await getCourse(courseId);
  const query = new URLSearchParams();
  if (term) query.set("term", term);
  if (section) query.set("section", section);
  const q = query.toString() ? `?${query}` : "";
  redirect(`/sites/${course.siteId}/courses/${course.id}/gradebook${q}`);
}
