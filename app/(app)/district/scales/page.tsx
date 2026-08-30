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
import { createScaleAction } from "@/lib/actions/mutations";
import { listScales } from "@/lib/data/repo";

export default async function ScalesPage() {
  const scales = await listScales();

  return (
    <div>
      <PageHeader
        eyebrow="District office"
        title="Grade scales"
        description="Marks appear on every gradebook and report card that uses the scale. Labels are stored in English and Spanish."
        actions={
          <Dialog>
            <DialogTrigger className="inline-flex h-8 items-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground">
              New scale
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create grade scale</DialogTitle>
              </DialogHeader>
              <form action={createScaleAction} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Scale name</Label>
                  <Input id="name" name="name" required placeholder="A–F" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Four rows are provided. Leave unused rows blank.
                </p>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="grid grid-cols-12 items-end gap-2">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Code</Label>
                      <Input name="markCode" placeholder={["A", "B", "C", "D", "F"][i]} />
                    </div>
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs">English</Label>
                      <Input name="markLabelEn" />
                    </div>
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs">Español</Label>
                      <Input name="markLabelEs" />
                    </div>
                    <label className="col-span-2 mb-2 flex items-center gap-1 text-xs">
                      <input type="checkbox" name="markPassing" value={String(i)} defaultChecked={i < 4} />
                      Pass
                    </label>
                  </div>
                ))}
                <Button type="submit">Save scale</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {scales.map((scale) => (
          <div key={scale.id} className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-heading text-lg">{scale.name}</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {scale.marks.map((mark) => (
                <li key={mark.id} className="flex justify-between gap-3">
                  <span>
                    <span className="font-mono font-semibold">{mark.code}</span>
                    <span className="ml-2">{mark.labelEn}</span>
                    <span className="ml-2 text-muted-foreground">/ {mark.labelEs}</span>
                  </span>
                  {!mark.isPassing ? (
                    <span className="text-xs text-destructive">Not passing</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
