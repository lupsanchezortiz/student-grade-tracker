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
        description="Choose semester, trimester, or quarter. Term names are stored in English and Spanish for report cards."
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
                <div className="space-y-1.5">
                  <Label htmlFor="termStructure">Structure</Label>
                  <select
                    id="termStructure"
                    name="termStructure"
                    className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                    defaultValue="trimester"
                  >
                    <option value="semester">Semesters (2)</option>
                    <option value="trimester">Trimesters (3)</option>
                    <option value="quarter">Quarters (4)</option>
                  </select>
                </div>
                <Button type="submit">Create year and terms</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      {years.length === 0 ? (
        <EmptyState
          title="No school year yet"
          description="Create 2027–28 (or the current year) and pick how the year is divided. Sites cannot open courses until a year exists."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Structure</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.map((year) => (
                <TableRow key={year.id}>
                  <TableCell className="font-medium">{year.name}</TableCell>
                  <TableCell className="capitalize">{year.termStructure}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(year.startDate)} – {formatDate(year.endDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/district/years/${year.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Edit terms
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
