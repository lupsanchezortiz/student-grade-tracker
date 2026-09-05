import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CsvImportDialog } from "@/components/csv-import-dialog";
import { addStaffAction } from "@/lib/actions/mutations";
import { getSessionUser } from "@/lib/auth/session";
import { getSite, listStaff } from "@/lib/data/repo";

export default async function StaffPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const [site, staff, user] = await Promise.all([
    getSite(siteId),
    listStaff(siteId),
    getSessionUser(),
  ]);
  const canImport =
    user?.isSystemAdmin ||
    user?.memberships.some((m) => m.siteId === siteId && m.role === "site_admin");

  return (
    <div>
      <PageHeader
        eyebrow={site.name}
        title="Staff"
        description="Site administrators manage roster and courses. Teachers need to be added to a course before they can grade."
        actions={
          <>
          {canImport ? <CsvImportDialog kind="staff" siteId={siteId} /> : null}
          <Dialog>
            <DialogTrigger className="inline-flex h-8 items-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground">
              Add staff
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add staff member</DialogTitle>
              </DialogHeader>
              <form action={addStaffAction} className="space-y-3">
                <input type="hidden" name="siteId" value={siteId} />
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input name="fullName" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input name="email" type="email" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <select
                    name="role"
                    className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                    defaultValue="teacher"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="site_admin">Site administrator</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  In demo mode they can sign in with this email and password demo.
                </p>
                <Button type="submit">Add to school</Button>
              </form>
            </DialogContent>
          </Dialog>
          </>
        }
      />
      {staff.length === 0 ? (
        <EmptyState
          title="No staff at this school"
          description="Add a teacher, then attach them to a course with grade and print permission."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.profile.fullName}</TableCell>
                  <TableCell>{row.profile.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {row.role === "site_admin" ? "Site admin" : "Teacher"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
