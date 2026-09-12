import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateYearAction } from "@/lib/actions/mutations";
import { getYear, listYearSiteCalendars } from "@/lib/data/repo";
import { TERM_STRUCTURE_NAMES } from "@/lib/data/terms";
import { formatDate } from "@/lib/format";

export default async function YearDetailPage({
  params,
}: {
  params: Promise<{ yearId: string }>;
}) {
  const { yearId } = await params;
  let data;
  let calendars;
  try {
    [data, calendars] = await Promise.all([getYear(yearId), listYearSiteCalendars(yearId)]);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="School year"
        title={data.year.name}
        description="This window is district-wide. You can set each school’s terms here, or a site administrator can do it at the school."
      />
      <form
        action={updateYearAction}
        className="mb-8 space-y-3 rounded-xl border border-border bg-card p-4"
      >
        <input type="hidden" name="id" value={data.year.id} />
        <div className="space-y-1.5">
          <Label htmlFor="name">Year name</Label>
          <Input id="name" name="name" defaultValue={data.year.name} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="startDate">Starts</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={data.year.startDate}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endDate">Ends</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={data.year.endDate}
              required
            />
          </div>
        </div>
        <Button type="submit">Save year</Button>
      </form>
      <h2 className="font-heading mb-3 text-lg">School terms</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Each school has its own semester, trimester, or quarter calendar for this year.
      </p>
      <div className="grid gap-2">
        {calendars.map(({ site, terms, termStructure }) => (
          <Link
            key={site.id}
            href={`/sites/${site.id}/terms/${yearId}`}
            className="flex flex-col justify-between gap-1 rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/50 sm:flex-row sm:items-center"
          >
            <div>
              <p className="font-medium">{site.name}</p>
              <p className="text-sm text-muted-foreground">{site.code}</p>
            </div>
            <span className="text-sm text-primary">
              {termStructure
                ? `${TERM_STRUCTURE_NAMES[termStructure]} · ${terms.length} terms`
                : "Set terms"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
