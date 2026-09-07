import Link from "next/link";
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
import { cn } from "@/lib/utils";

export default async function ScalesPage({
  searchParams,
}: {
  searchParams: Promise<{ scale?: string }>;
}) {
  const { scale: selectedId } = await searchParams;
  const scales = await listScales();
  const selected = scales.find((scale) => scale.id === selectedId) ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Report cards"
        title="Grade scales"
        description="Choose a scale to edit its marks. Those marks appear on every gradebook and report card that uses the scale."
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
                  <MarkRow
                    key={i}
                    index={i}
                    placeholder={["A", "B", "C", "D", "F"][i]}
                    passDefault={i < 4}
                  />
                ))}
                <Button type="submit">Save scale</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {scales.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
          No grade scales yet. Create one to use on report-card line items.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
          <nav
            className={cn(
              "rounded-xl border border-border bg-card",
              selected ? "hidden lg:block" : "block",
            )}
            aria-label="Grade scales"
          >
            <ul className="divide-y divide-border">
              {scales.map((scale) => {
                const active = scale.id === selected?.id;
                return (
                  <li key={scale.id}>
                    <Link
                      href={`/district/scales?scale=${scale.id}`}
                      className={cn(
                        "block px-4 py-3 hover:bg-muted/70",
                        active && "bg-muted",
                      )}
                    >
                      <p className="font-medium">{scale.name}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {scale.marks.map((mark) => mark.code).join(" · ") || "No marks"}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {selected ? (
            <form
              action={updateScaleAction}
              className="space-y-3 rounded-xl border border-border bg-card p-4"
            >
              <input type="hidden" name="id" value={selected.id} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Label htmlFor={`scale-name-${selected.id}`}>Scale name</Label>
                  <Input
                    id={`scale-name-${selected.id}`}
                    name="name"
                    defaultValue={selected.name}
                    required
                  />
                </div>
                <Link
                  href="/district/scales"
                  className="mt-6 text-sm text-primary hover:underline lg:hidden"
                >
                  All scales
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                Labels are stored in English and Spanish. Add a mark with the blank row at the
                bottom.
              </p>
              <div className="space-y-2">
                {selected.marks.map((mark, i) => (
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
                <MarkRow index={selected.marks.length} placeholder="+" />
              </div>
              <Button type="submit" variant="outline" size="sm">
                Save scale
              </Button>
            </form>
          ) : (
            <div className="hidden rounded-xl border border-dashed border-border px-4 py-12 text-sm text-muted-foreground lg:block">
              Select a scale to edit its name and marks.
            </div>
          )}
        </div>
      )}
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
