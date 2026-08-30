import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addItemAction,
  addSectionAction,
  deleteItemAction,
  deleteSectionAction,
  moveItemAction,
  moveSectionAction,
  publishTemplateAction,
  updateItemAction,
  updateSectionAction,
  updateTemplateAction,
} from "@/lib/actions/mutations";
import {
  getTemplate,
  listGradeLevels,
  listScales,
  listYears,
} from "@/lib/data/repo";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  let template;
  try {
    template = await getTemplate(templateId);
  } catch {
    notFound();
  }
  const [years, scales, levels] = await Promise.all([
    listYears(),
    listScales(),
    listGradeLevels(),
  ]);

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Report card template"
        title={template.name}
        description="Sections and line items become gradebook columns. English and Spanish labels print on the PDF."
        actions={
          template.status === "draft" ? (
            <form action={publishTemplateAction}>
              <input type="hidden" name="id" value={template.id} />
              <Button type="submit">Publish</Button>
            </form>
          ) : (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
              Published
            </span>
          )
        }
      />

      <form
        action={updateTemplateAction}
        className="mb-8 space-y-3 rounded-xl border border-border bg-card p-4"
      >
        <input type="hidden" name="id" value={template.id} />
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input name="name" defaultValue={template.name} required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>School year</Label>
            <select
              name="academicYearId"
              defaultValue={template.academicYearId}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Grade scale</Label>
            <select
              name="gradeScaleId"
              defaultValue={template.gradeScaleId}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              {scales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Assign to grades</legend>
          <div className="flex flex-wrap gap-3">
            {levels.map((level) => (
              <label key={level.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  name="gradeLevelId"
                  value={level.id}
                  defaultChecked={template.gradeLevelIds.includes(level.id)}
                />
                {level.code}
              </label>
            ))}
          </div>
        </fieldset>
        <Button type="submit" variant="outline">
          Save assignment
        </Button>
      </form>

      <div className="space-y-6">
        {template.sections.map((section, index) => (
          <section
            key={section.id}
            className="rounded-xl border border-border bg-card p-4"
          >
            <form action={updateSectionAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={section.id} />
              <div className="space-y-1.5">
                <Label>Section (English)</Label>
                <Input name="titleEn" defaultValue={section.titleEn} required />
              </div>
              <div className="space-y-1.5">
                <Label>Sección (español)</Label>
                <Input name="titleEs" defaultValue={section.titleEs} required />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" size="sm" variant="outline">
                  Save section
                </Button>
              </div>
            </form>
            <div className="mt-2 flex flex-wrap gap-2">
              <form action={moveSectionAction}>
                <input type="hidden" name="id" value={section.id} />
                <input type="hidden" name="direction" value="up" />
                <Button type="submit" size="sm" variant="ghost" disabled={index === 0}>
                  Up
                </Button>
              </form>
              <form action={moveSectionAction}>
                <input type="hidden" name="id" value={section.id} />
                <input type="hidden" name="direction" value="down" />
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  disabled={index === template.sections.length - 1}
                >
                  Down
                </Button>
              </form>
              <form action={deleteSectionAction}>
                <input type="hidden" name="id" value={section.id} />
                <Button type="submit" size="sm" variant="destructive">
                  Delete section
                </Button>
              </form>
            </div>

            <ul className="mt-4 space-y-3 border-t border-border pt-4">
              {section.items.map((item, itemIndex) => (
                <li key={item.id} className="rounded-lg bg-muted/40 p-3">
                  <form action={updateItemAction} className="grid gap-2 sm:grid-cols-2">
                    <input type="hidden" name="id" value={item.id} />
                    <Input name="titleEn" defaultValue={item.titleEn} required />
                    <Input name="titleEs" defaultValue={item.titleEs} required />
                    <select
                      name="itemType"
                      defaultValue={item.itemType}
                      className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                    >
                      <option value="mark">Mark (dropdown)</option>
                      <option value="comment">Comment</option>
                    </select>
                    <Button type="submit" size="sm" variant="outline">
                      Save item
                    </Button>
                  </form>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <form action={moveItemAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="direction" value="up" />
                      <Button type="submit" size="xs" variant="ghost" disabled={itemIndex === 0}>
                        Up
                      </Button>
                    </form>
                    <form action={moveItemAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="direction" value="down" />
                      <Button
                        type="submit"
                        size="xs"
                        variant="ghost"
                        disabled={itemIndex === section.items.length - 1}
                      >
                        Down
                      </Button>
                    </form>
                    <form action={deleteItemAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button type="submit" size="xs" variant="destructive">
                        Remove
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>

            <form action={addItemAction} className="mt-3 grid gap-2 sm:grid-cols-4">
              <input type="hidden" name="sectionId" value={section.id} />
              <Input name="titleEn" placeholder="New item (English)" required />
              <Input name="titleEs" placeholder="Nuevo criterio" required />
              <select
                name="itemType"
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                defaultValue="mark"
              >
                <option value="mark">Mark</option>
                <option value="comment">Comment</option>
              </select>
              <Button type="submit" variant="secondary">
                Add item
              </Button>
            </form>
          </section>
        ))}
      </div>

      <form
        action={addSectionAction}
        className="mt-6 grid gap-2 rounded-xl border border-dashed border-border p-4 sm:grid-cols-3"
      >
        <input type="hidden" name="templateId" value={template.id} />
        <Input name="titleEn" placeholder="New section (English)" required />
        <Input name="titleEs" placeholder="Nueva sección" required />
        <Button type="submit" variant="outline">
          Add section
        </Button>
      </form>
    </div>
  );
}
