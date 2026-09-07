import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CsvImportDialog } from "@/components/csv-import-dialog";
import { createStudentAction } from "@/lib/actions/mutations";
import { getSessionUser } from "@/lib/auth/session";
import { getSite, listGradeLevels, listStudents } from "@/lib/data/repo";
import { gradeLabel, studentName } from "@/lib/format";

export default async function StudentsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const [site, students, levels, user] = await Promise.all([
    getSite(siteId),
    listStudents(siteId),
    listGradeLevels(),
    getSessionUser(),
  ]);
  const canImport =
    user?.isSystemAdmin ||
    user?.memberships.some((m) => m.siteId === siteId && m.role === "site_admin");

  return (
    <div>
      <PageHeader
        eyebrow={site.name}
        title="Students"
        description="Roster is site-specific. Enroll students into a course to place them on that gradebook. Import attendance here or from a course’s Attendance tab."
        actions={
          <>
          {canImport ? <CsvImportDialog kind="students" siteId={siteId} /> : null}
          {canImport ? (
            <CsvImportDialog
              kind="attendance"
              siteId={siteId}
              triggerLabel="Import attendance"
            />
          ) : null}
          <Dialog>
            <DialogTrigger className="inline-flex h-8 items-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground">
              Add student
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New student</DialogTitle>
              </DialogHeader>
              <form action={createStudentAction} className="space-y-3">
                <input type="hidden" name="siteId" value={siteId} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>First name</Label>
                    <Input name="firstName" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Last name</Label>
                    <Input name="lastName" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Preferred name</Label>
                    <Input name="preferredName" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Student number</Label>
                    <Input name="studentNumber" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                  <div className="space-y-1.5">
                    <Label>Home language</Label>
                    <select
                      name="homeLanguage"
                      className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                      defaultValue="en"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                </div>
                <Button type="submit">Add to roster</Button>
              </form>
            </DialogContent>
          </Dialog>
          </>
        }
      />
      {students.length === 0 ? (
        <EmptyState
          title="Roster is empty"
          description="Add students at this school. They will not appear in a gradebook until you enroll them in a course."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Home language</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{studentName(student)}</TableCell>
                  <TableCell className="font-mono text-xs">{student.studentNumber}</TableCell>
                  <TableCell>{gradeLabel(levels, student.gradeLevelId)}</TableCell>
                  <TableCell className="uppercase">{student.homeLanguage}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
