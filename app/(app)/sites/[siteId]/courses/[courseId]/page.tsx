import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { CsvImportDialog } from "@/components/csv-import-dialog";
import { setEnrollmentsAction, setTeachersAction } from "@/lib/actions/mutations";
import { getCourse, listStaff, listStudents } from "@/lib/data/repo";
import { isSpecialistSection } from "@/lib/data/access";
import { sectionTitle } from "@/lib/data/template-doc";
import { studentName } from "@/lib/format";

export default async function CourseSetupPage({
  params,
}: {
  params: Promise<{ siteId: string; courseId: string }>;
}) {
  const { siteId, courseId } = await params;
  let course;
  try {
    course = await getCourse(courseId);
  } catch {
    notFound();
  }
  if (course.siteId !== siteId) notFound();
  const [students, staff] = await Promise.all([
    listStudents(siteId),
    listStaff(siteId),
  ]);
  const enrolled = new Set(course.enrollments.map((e) => e.studentId));
  const assigned = new Map(course.teachers.map((t) => [t.profileId, t]));
  const eligible = students.filter((s) => s.gradeLevelId === course.gradeLevelId);
  const specialistSections = course.template.sections.filter(isSpecialistSection);

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow={course.site.name}
        title={course.name}
        description={`${course.gradeLevel.nameEn} · ${course.year.name} · template: ${course.template.name}`}
        actions={
          <Button render={<Link href={`/sites/${siteId}/courses/${course.id}/gradebook`} />}>
            Open gradebook
          </Button>
        }
      />

      <section className="mb-8 rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg">Enroll students</h2>
            <p className="text-sm text-muted-foreground">
              Showing students in {course.gradeLevel.nameEn} at this school.
            </p>
          </div>
          <CsvImportDialog kind="enrollments" siteId={siteId} triggerLabel="Import CSV" />
        </div>
        {eligible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No students in this grade. Add them on the roster first.
          </p>
        ) : (
          <form action={setEnrollmentsAction} className="space-y-3">
            <input type="hidden" name="courseId" value={course.id} />
            <ul className="divide-y divide-border rounded-lg border border-border">
              {eligible.map((student) => (
                <li key={student.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    name="studentId"
                    value={student.id}
                    defaultChecked={enrolled.has(student.id)}
                  />
                  <span className="font-medium">{studentName(student)}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {student.studentNumber}
                  </span>
                </li>
              ))}
            </ul>
            <Button type="submit">Save enrollment</Button>
          </form>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-heading text-lg">Teachers and permissions</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Grade lets them edit the book. Print lets them generate report cards.
          {specialistSections.length > 0
            ? " Homeroom teachers see specialist marks but cannot enter them. Assign each specials section to the teacher who grades it."
            : null}
        </p>
        {staff.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add staff at this school first.</p>
        ) : (
          <form action={setTeachersAction} className="space-y-3">
            <input type="hidden" name="courseId" value={course.id} />
            <ul className="divide-y divide-border rounded-lg border border-border">
              {staff.map((row) => {
                const current = assigned.get(row.profileId);
                const entersHomeroom =
                  current?.gradesHomeroom ?? !current?.sectionIds?.length;
                return (
                  <li key={row.profileId} className="grid gap-2 px-3 py-2 text-sm">
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="profileId"
                          value={row.profileId}
                          defaultChecked={Boolean(current)}
                        />
                        <span>
                          <span className="font-medium">{row.profile.fullName}</span>
                          <span className="ml-2 text-muted-foreground">{row.role}</span>
                        </span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          name="canGrade"
                          value={row.profileId}
                          defaultChecked={current?.canGrade ?? true}
                        />
                        Can grade
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          name="canPrint"
                          value={row.profileId}
                          defaultChecked={current?.canPrint ?? true}
                        />
                        Can print
                      </label>
                    </div>
                    {specialistSections.length > 0 ? (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pl-6 text-xs text-muted-foreground">
                        <span className="w-full font-medium text-foreground sm:w-auto">
                          Enters
                        </span>
                        <label className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            name="gradeHomeroom"
                            value={row.profileId}
                            defaultChecked={entersHomeroom}
                          />
                          Homeroom subjects
                        </label>
                        {specialistSections.map((section) => (
                          <label key={section.id} className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              name={`gradeSection:${row.profileId}`}
                              value={section.id}
                              defaultChecked={Boolean(current?.sectionIds?.includes(section.id))}
                            />
                            {sectionTitle(section, course.template.locale)}
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <Button type="submit">Save permissions</Button>
          </form>
        )}
      </section>
    </div>
  );
}
