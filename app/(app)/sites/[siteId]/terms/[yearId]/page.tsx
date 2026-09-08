import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSiteTermsAction, updateTermAction } from "@/lib/actions/mutations";
import { getSite, getSiteYear } from "@/lib/data/repo";
import { TERM_STRUCTURE_NAMES } from "@/lib/data/terms";
import { formatDate } from "@/lib/format";

export default async function SiteYearTermsPage({
  params,
}: {
  params: Promise<{ siteId: string; yearId: string }>;
}) {
  const { siteId, yearId } = await params;
  const site = await getSite(siteId);
  let data;
  try {
    data = await getSiteYear(siteId, yearId);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow={`${site.name} · Terms`}
        title={data.year.name}
        description={`District year ${formatDate(data.year.startDate)} – ${formatDate(data.year.endDate)}. Term names and dates are this school’s.`}
        actions={
          <Link href={`/sites/${siteId}/terms`} className="text-sm text-primary hover:underline">
            All years
          </Link>
        }
      />

      {data.canEdit ? (
        <form
          action={createSiteTermsAction}
          className="mb-8 space-y-3 rounded-xl border border-border bg-card p-4"
        >
          <input type="hidden" name="siteId" value={siteId} />
          <input type="hidden" name="yearId" value={yearId} />
          <div className="space-y-1.5">
            <Label htmlFor="termStructure">Grading periods</Label>
            <select
              id="termStructure"
              name="termStructure"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              defaultValue={data.termStructure ?? "trimester"}
            >
              <option value="semester">Semesters (2)</option>
              <option value="trimester">Trimesters (3)</option>
              <option value="quarter">Quarters (4)</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            {data.terms.length
              ? "Changing the structure replaces empty terms. Terms that already have marks keep their structure."
              : "Creates bilingual term names and splits the district year into even date ranges. You can edit names and dates after."}
          </p>
          <Button type="submit">
            {data.terms.length ? "Rebuild terms" : "Create terms"}
          </Button>
        </form>
      ) : data.termStructure ? (
        <p className="mb-6 text-sm text-muted-foreground">
          This school uses a {TERM_STRUCTURE_NAMES[data.termStructure].toLowerCase()} calendar.
          A site administrator can change names and dates.
        </p>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          A site administrator still needs to set terms for this year.
        </p>
      )}

      <div className="space-y-4">
        {data.terms.map((term) =>
          data.canEdit ? (
            <form
              key={term.id}
              action={updateTermAction}
              className="space-y-3 rounded-xl border border-border bg-card p-4"
            >
              <input type="hidden" name="id" value={term.id} />
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Term {term.sortOrder}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>English name</Label>
                  <Input name="nameEn" defaultValue={term.nameEn} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Nombre en español</Label>
                  <Input name="nameEs" defaultValue={term.nameEs} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Starts</Label>
                  <Input name="startDate" type="date" defaultValue={term.startDate} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Ends</Label>
                  <Input name="endDate" type="date" defaultValue={term.endDate} required />
                </div>
              </div>
              <Button type="submit" variant="outline">
                Save term
              </Button>
            </form>
          ) : (
            <div key={term.id} className="rounded-xl border border-border bg-card p-4">
              <p className="font-medium">{term.nameEn}</p>
              <p className="text-sm text-muted-foreground">{term.nameEs}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(term.startDate)} – {formatDate(term.endDate)}
              </p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
