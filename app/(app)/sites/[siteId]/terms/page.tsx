import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { getSite, listSiteYears } from "@/lib/data/repo";
import { TERM_STRUCTURE_NAMES } from "@/lib/data/terms";
import { formatDate } from "@/lib/format";

export default async function SiteTermsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const [site, years] = await Promise.all([getSite(siteId), listSiteYears(siteId)]);

  return (
    <div>
      <PageHeader
        eyebrow={site.name}
        title="Terms"
        description="The district sets the school year. A site or district administrator chooses semester, trimester, or quarter and the dates that print on report cards."
      />
      {years.length === 0 ? (
        <EmptyState
          title="No school year yet"
          description="The district office needs to create a school year before this site can set terms."
        />
      ) : (
        <div className="grid gap-2">
          {years.map(({ year, terms, termStructure }) => (
            <Link
              key={year.id}
              href={`/sites/${siteId}/terms/${year.id}`}
              className="flex flex-col justify-between gap-1 rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/50 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-medium">{year.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(year.startDate)} – {formatDate(year.endDate)}
                </p>
              </div>
              <span className="text-sm text-primary">
                {termStructure
                  ? `${TERM_STRUCTURE_NAMES[termStructure]} · ${terms.length} terms`
                  : "Set terms"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
