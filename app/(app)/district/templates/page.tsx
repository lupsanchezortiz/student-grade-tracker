import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
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
import { createTemplateAction } from "@/lib/actions/mutations";
import { listGradeLevels, listScales, listTemplates } from "@/lib/data/repo";
import { TERM_STRUCTURE_NAMES } from "@/lib/data/terms";
import { gradeLabel } from "@/lib/format";

export default async function TemplatesPage() {
  const [templates, scales, levels] = await Promise.all([
    listTemplates(),
    listScales(),
    listGradeLevels(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="District office"
        title="Report card templates"
        description="One language and one grading period (trimester, semester, or quarter) per template. School year prints from the course. Assign a scale on each line item."
        actions={
          scales.length ? (
            <Dialog>
              <DialogTrigger className="inline-flex h-8 items-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground">
                New template
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New report card</DialogTitle>
                </DialogHeader>
                <form action={createTemplateAction} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required placeholder="Middle school progress report" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="locale">Language</Label>
                    <select
                      id="locale"
                      name="locale"
                      className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                      defaultValue="en"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="termStructure">Grading periods</Label>
                    <select
                      id="termStructure"
                      name="termStructure"
                      className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                      defaultValue="trimester"
                    >
                      <option value="trimester">Trimester (F / W / S)</option>
                      <option value="semester">Semester</option>
                      <option value="quarter">Quarter</option>
                    </select>
                  </div>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Assign to grades</legend>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {levels.map((level) => (
                        <label key={level.id} className="flex items-center gap-1.5 text-sm">
                          <input type="checkbox" name="gradeLevelId" value={level.id} />
                          {level.code}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <Button type="submit">Create draft</Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      {templates.length === 0 ? (
        <EmptyState
          title="No report cards yet"
          description="Create a template, add the subjects or habits you grade, assign it to grade levels, then publish. Schools will build gradebooks from it."
        />
      ) : (
        <div className="grid gap-3">
          {templates.map((template) => (
            <Link
              key={template.id}
              href={`/district/templates/${template.id}`}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{template.name}</p>
                <p className="text-sm text-muted-foreground">
                  {template.locale === "es" ? "Spanish" : "English"} ·{" "}
                  {TERM_STRUCTURE_NAMES[template.termStructure]} · {template.itemCount} items
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {template.gradeLevelIds.map((id) => (
                  <Badge key={id} variant="secondary">
                    {gradeLabel(levels, id)}
                  </Badge>
                ))}
                <Badge variant={template.status === "published" ? "default" : "outline"}>
                  {template.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
