import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { getSessionUser } from "@/lib/auth/session";
import { listDistrictCourses } from "@/lib/data/repo";

export default async function DistrictReportsPage() {
  const user = await getSessionUser();
  if (!user?.isSystemAdmin) redirect("/");
  const courses = await listDistrictCourses();
  const grouped = new Map<string, typeof courses>();
  for (const course of courses) {
    const key = course.site.name;
    const list = grouped.get(key) ?? [];
    list.push(course);
    grouped.set(key, list);
  }
  const schools = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div>
      <PageHeader
        eyebrow="Report cards"
        title="Report card reports"
        description="Open a class to print or download cards. Marks come from the gradebook; the document comes from the published template for that grade."
      />
      {schools.length === 0 ? (
        <EmptyState
          title="No classes to print"
          description="After a school creates a course and enrolls students, the class will show up here."
        />
      ) : (
        <div className="space-y-8">
          {schools.map(([siteName, siteCourses]) => (
            <section key={siteName}>
              <h2 className="font-heading mb-3 text-lg">{siteName}</h2>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {siteCourses
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((course) => (
                    <li key={course.id}>
                      <Link
                        href={`/sites/${course.siteId}/courses/${course.id}/report-cards`}
                        className="flex flex-col gap-1 px-4 py-3 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium">{course.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {course.year.name} · {course.gradeLevel.code} ·{" "}
                            {course.template.name}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {course.enrollments.length === 1
                            ? "1 student"
                            : `${course.enrollments.length} students`}
                        </p>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
