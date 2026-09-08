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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createYearAction } from "@/lib/actions/mutations";
import { listYears } from "@/lib/data/repo";
import { formatDate } from "@/lib/format";

export default async function YearsPage() {
  const years = await listYears();

  return (
    <div>
      <PageHeader
        eyebrow="District office"
        title="School years"
        description="Set the district calendar window. Each school sets its own terms (semester, trimester, or quarter) for that year."
        actions={
          <Dialog>
            <DialogTrigger className="inline-flex h-8 items-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground">
              New school year
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create school year</DialogTitle>
              </DialogHeader>
              <form action={createYearAction} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required placeholder="2027–28" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate">Starts</Label>
                    <Input id="startDate" name="startDate" type="date" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="endDate">Ends</Label>
                    <Input id="endDate" name="endDate" type="date" required />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Site administrators choose grading periods after you create the year.
                </p>
                <Button type="submit">Create year</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      {years.length === 0 ? (
        <EmptyState
          title="No school year yet"
          description="Create 2027–28 (or the current year). Sites cannot set terms or open courses until a year exists."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.map((year) => (
                <TableRow key={year.id}>
                  <TableCell className="font-medium">{year.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(year.startDate)} – {formatDate(year.endDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/district/years/${year.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Edit year
                    </Link>
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
