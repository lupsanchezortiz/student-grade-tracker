import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCourseAction } from "@/lib/actions/mutations";
import { getSite, listCourses, listGradeLevels, listYears } from "@/lib/data/repo";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const [site, courses, years, levels] = await Promise.all([
    getSite(siteId),
    listCourses(siteId),
    listYears(),
    listGradeLevels(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow={site.name}
        title="Courses"
        description="A course locks to the published district report card for that grade and year. That card is the gradebook."
        actions={
          years.length ? (
            <Dialog>
              <DialogTrigger className="inline-flex h-8 items-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground">
                New course
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create course</DialogTitle>
                </DialogHeader>
                <form action={createCourseAction} className="space-y-3">
                  <input type="hidden" name="siteId" value={siteId} />
                  <div className="space-y-1.5">
                    <Label>Course name</Label>
                    <Input name="name" required placeholder="Grade 2 Homeroom — Diaz" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>School year</Label>
                    <select
                      name="academicYearId"
                      className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                      defaultValue={years[0]?.id}
                    >
                      {years.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Grade</Label>
                    <select
                      name="gradeLevelId"
                      className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                      defaultValue={levels[3]?.id}
                    >
                      {levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The district must have a published template assigned to this grade.
                  </p>
                  <Button type="submit">Create gradebook</Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      {courses.length === 0 ? (
        <EmptyState
          title="No courses at this school"
          description="Create a course for a grade that already has a published district report card. Then enroll students and assign a teacher."
        />
      ) : (
        <div className="grid gap-2">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{course.name}</p>
                <p className="text-sm text-muted-foreground">
                  {course.gradeLevel.nameEn} · {course.template.name} · {course.enrollments.length} enrolled
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" render={<Link href={`/sites/${siteId}/courses/${course.id}`} />}>
                  Roster & staff
                </Button>
                <Button size="sm" render={<Link href={`/sites/${siteId}/courses/${course.id}/gradebook`} />}>
                  Gradebook
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
