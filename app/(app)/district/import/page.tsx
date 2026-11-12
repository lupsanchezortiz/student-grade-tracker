import { redirect } from "next/navigation";
import { CsvImportDialog } from "@/components/csv-import-dialog";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";

export default async function DistrictImportPage() {
  const user = await getSessionUser();
  if (!user?.isSystemAdmin) redirect("/");
  return (
    <div>
      <PageHeader
        eyebrow="District office"
        title="CSV import"
        description="Load students, staff, courses, enrollments, and attendance for any school. Report-card line items are imported from the template editor."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Key: school code + student number. Include grade and home language (en/es).</p>
            <CsvImportDialog kind="students" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Staff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Key: email + school. Role is teacher or site_admin. Demo password is demo.</p>
            <CsvImportDialog kind="staff" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Key: school + year + name. A published template for that grade is attached automatically.
            </p>
            <CsvImportDialog kind="courses" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Enrollments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Key: school + year + grade + course name + student number. Enrolls students into courses.
            </p>
            <CsvImportDialog kind="enrollments" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Key: school + student number + year + term. Teachers see absences and
              tardies on the gradebook Attendance tab; they cannot type them.
            </p>
            <CsvImportDialog kind="attendance" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
