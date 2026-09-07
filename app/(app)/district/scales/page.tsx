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
import { createScaleAction, updateScaleAction } from "@/lib/actions/mutations";
import { listScales } from "@/lib/data/repo";

export default async function ScalesPage() {
  const scales = await listScales();

  return (
    <div>
      <PageHeader
        eyebrow="Report cards"
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
                  Five rows are provided. Leave unused rows blank.
                </p>
                {[0, 1, 2, 3, 4].map((i) => (
                  <MarkRow key={i} index={i} placeholder={["A", "B", "C", "D", "F"][i]} passDefault={i < 4} />
                ))}
                <Button type="submit">Save scale</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {scales.map((scale) => (
          <form
            key={scale.id}
            action={updateScaleAction}
            className="space-y-3 rounded-xl border border-border bg-card p-4"
          >
            <input type="hidden" name="id" value={scale.id} />
            <div className="space-y-1.5">
              <Label htmlFor={`scale-name-${scale.id}`}>Scale name</Label>
              <Input
                id={`scale-name-${scale.id}`}
                name="name"
                defaultValue={scale.name}
                required
              />
            </div>
            <div className="space-y-2">
              {scale.marks.map((mark, i) => (
                <MarkRow
                  key={mark.id}
                  index={i}
                  markId={mark.id}
                  code={mark.code}
                  labelEn={mark.labelEn}
                  labelEs={mark.labelEs}
                  passDefault={mark.isPassing}
                />
              ))}
              <MarkRow index={scale.marks.length} placeholder="+" />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Save scale
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}

function MarkRow({
  index,
  markId,
  code,
  labelEn,
  labelEs,
  placeholder,
  passDefault = true,
}: {
  index: number;
  markId?: string;
  code?: string;
  labelEn?: string;
  labelEs?: string;
  placeholder?: string;
  passDefault?: boolean;
}) {
  return (
    <div className="grid grid-cols-12 items-end gap-2">
      <input type="hidden" name="markId" value={markId ?? ""} />
      <div className="col-span-2 space-y-1">
        <Label className="text-xs">Code</Label>
        <Input name="markCode" defaultValue={code} placeholder={placeholder} className="font-mono" />
      </div>
      <div className="col-span-4 space-y-1">
        <Label className="text-xs">English</Label>
        <Input name="markLabelEn" defaultValue={labelEn} />
      </div>
      <div className="col-span-4 space-y-1">
        <Label className="text-xs">Español</Label>
        <Input name="markLabelEs" defaultValue={labelEs} />
      </div>
      <label className="col-span-2 mb-2 flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          name="markPassing"
          value={String(index)}
          defaultChecked={passDefault}
        />
        Pass
      </label>
    </div>
  );
}
