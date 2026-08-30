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
import { createSiteAction } from "@/lib/actions/mutations";
import { listSites } from "@/lib/data/repo";
import Link from "next/link";

export default async function DistrictSitesPage() {
  const sites = await listSites();

  return (
    <div>
      <PageHeader
        eyebrow="District office"
        title="Schools"
        description="Each campus has its own staff and students. They share the district calendar and report-card templates."
        actions={
          <Dialog>
            <DialogTrigger className="inline-flex h-8 items-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground">
              Add school
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New school</DialogTitle>
              </DialogHeader>
              <form action={createSiteAction} className="space-y-3">
                <Field name="name" label="Name" placeholder="Oak Park Elementary" />
                <Field name="code" label="Code" placeholder="OAK" />
                <Field name="address" label="Address" placeholder="12 Oak Street" />
                <Button type="submit">Create school</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      {sites.length === 0 ? (
        <EmptyState
          title="No schools yet"
          description="Add the first campus. Site administrators will enroll students and open courses from district templates."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Address</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium">{site.name}</TableCell>
                  <TableCell>{site.code}</TableCell>
                  <TableCell className="text-muted-foreground">{site.address}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/sites/${site.id}`} className="text-sm text-primary hover:underline">
                      Open site
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

function Field({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required placeholder={placeholder} />
    </div>
  );
}
