import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTermAction, updateYearAction } from "@/lib/actions/mutations";
import { getYear } from "@/lib/data/repo";

export default async function YearDetailPage({
  params,
}: {
  params: Promise<{ yearId: string }>;
}) {
  const { yearId } = await params;
  let data;
  try {
    data = await getYear(yearId);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="School year"
        title={data.year.name}
        description="Adjust the year window and the bilingual names and dates for each term."
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
        <p className="text-sm text-muted-foreground capitalize">
          Structure: {data.year.termStructure}
        </p>
        <Button type="submit">Save year</Button>
      </form>
      <div className="space-y-4">
        {data.terms.map((term) => (
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
        ))}
      </div>
    </div>
  );
}
