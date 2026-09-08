import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateYearAction } from "@/lib/actions/mutations";
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
        description="This window is district-wide. Each school sets its own term names and dates on the Terms page."
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
    </div>
  );
}
