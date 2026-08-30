import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteOverview } from "@/lib/data/repo";

export default async function SiteHomePage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const data = await siteOverview(siteId);

  return (
    <div>
      <PageHeader
        eyebrow="School site"
        title={data.site.name}
        description={`${data.site.address} · ${data.site.code}. Courses inherit the district report card for their grade.`}
        actions={
          <Button render={<Link href={`/sites/${siteId}/courses`} />}>
            Courses
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl">{data.studentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl">{data.courseCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl">{data.teacherCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Site admins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl">{data.adminCount}</p>
          </CardContent>
        </Card>
      </div>
      <h2 className="font-heading mt-8 mb-3 text-xl">Courses</h2>
      {data.courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No courses yet. Create one after the district publishes a report card for that grade.
        </p>
      ) : (
        <div className="grid gap-2">
          {data.courses.map((course) => (
            <Link
              key={course.id}
              href={`/sites/${siteId}/courses/${course.id}/gradebook`}
              className="flex flex-col justify-between gap-1 rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/50 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-medium">{course.name}</p>
                <p className="text-sm text-muted-foreground">
                  {course.gradeLevel.nameEn} · {course.year.name} · {course.enrollments.length} students
                </p>
              </div>
              <span className="text-sm text-primary">Open gradebook</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
