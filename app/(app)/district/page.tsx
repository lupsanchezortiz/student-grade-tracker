import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";
import { districtOverview } from "@/lib/data/repo";

export default async function DistrictHomePage() {
  const user = await getSessionUser();
  if (!user?.isSystemAdmin) {
    const site = user?.memberships[0]?.siteId;
    redirect(site ? `/sites/${site}` : "/login");
  }
  const data = await districtOverview();

  return (
    <div>
      <PageHeader
        eyebrow="District office"
        title="Northside Unified"
        description="Set the school year and report-card templates here. Schools implement them: courses, enrollment, and marks."
        actions={
          <Button render={<Link href="/district/templates" />}>
            Open templates
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Schools" value={data.siteCount} href="/district/sites" />
        <Stat label="School years" value={data.yearCount} href="/district/years" />
        <Stat
          label="Published cards"
          value={`${data.publishedCount}/${data.templateCount}`}
          href="/district/templates"
        />
        <Stat label="Students district-wide" value={data.studentCount} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.sites.map((site) => (
              <Link
                key={site.id}
                href={`/sites/${site.id}`}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                <span>
                  <span className="font-medium">{site.name}</span>
                  <span className="ml-2 text-muted-foreground">{site.code}</span>
                </span>
                <span className="text-muted-foreground">Open site</span>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Report cards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No templates yet. Create one from a grade scale and assign it to grades.
              </p>
            ) : (
              data.templates.map((t) => (
                <Link
                  key={t.id}
                  href={`/district/templates/${t.id}`}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="text-muted-foreground capitalize">{t.status}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const inner = (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl">{value}</p>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
