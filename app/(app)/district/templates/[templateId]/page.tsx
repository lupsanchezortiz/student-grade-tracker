import { notFound } from "next/navigation";
import { CsvImportDialog } from "@/components/csv-import-dialog";
import { IconActionButton } from "@/components/icon-action-button";
import { PageHeader } from "@/components/page-header";
import { DocumentHtmlEditor } from "@/components/report-card/html-editor";
import { ReportCardPreview } from "@/components/report-card/preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addItemAction,
  addSectionAction,
  cloneTemplateLanguageAction,
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
} from "@/lib/data/repo";
import { itemTitle, localeLabel, sectionTitle } from "@/lib/data/template-doc";
import { TERM_STRUCTURE_NAMES } from "@/lib/data/terms";
import { previewTermMergeTags } from "@/lib/documents/print-code";

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
  const [scales, levels] = await Promise.all([
    listScales(),
    listGradeLevels(),
  ]);

  return (
    <div className="max-w-[92rem]">
      <PageHeader
        eyebrow="Report card template"
        title={template.name}
        description={`${localeLabel(template.locale)} ${TERM_STRUCTURE_NAMES[template.termStructure].toLowerCase()} card. School and year print from the course. A ${TERM_STRUCTURE_NAMES[template.termStructure].toLowerCase()} HTML layout will not apply to a year with different grading periods.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <form action={cloneTemplateLanguageAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={template.id} />
              <input
                type="hidden"
                name="name"
                value={`${template.name.replace(/\s+\((English|español)\)$/i, "")} (${template.locale === "en" ? "español" : "English"})`}
              />
              <select
                name="locale"
                defaultValue={template.locale === "en" ? "es" : "en"}
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                aria-label="New language"
              >
                {template.locale !== "en" ? <option value="en">English</option> : null}
                {template.locale !== "es" ? <option value="es">Spanish</option> : null}
              </select>
              <Button type="submit" variant="outline">
                Create language version
              </Button>
            </form>
            <CsvImportDialog
              kind="template_items"
              templateId={template.id}
              triggerLabel="Import items CSV"
            />
            {template.status === "draft" ? (
              <form action={publishTemplateAction}>
                <input type="hidden" name="id" value={template.id} />
                <Button type="submit">Publish</Button>
              </form>
            ) : (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                Published
              </span>
            )}
          </div>
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
            <Label>Language</Label>
            <select
              name="locale"
              defaultValue={template.locale}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Grading periods</Label>
            <select
              name="termStructure"
              defaultValue={template.termStructure}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="trimester">Trimester — tags 101 / 201 / 301</option>
              <option value="semester">Semester — tags 101 / 201</option>
              <option value="quarter">Quarter — tags 101 / 201 / 301 / 401</option>
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

      <div className="mb-10">
        <DocumentHtmlEditor template={template}>
      <p className="mb-3 text-sm text-muted-foreground">
        This card is for a {TERM_STRUCTURE_NAMES[template.termStructure].toLowerCase()} year.
        Line number 01 becomes{" "}
        <span className="font-mono">
          {previewTermMergeTags(1, template.termStructure).join(" ")}
        </span>
        . The HTML preview uses these line items. School and year on the printed card come from
        the course.
      </p>
      <div className="space-y-6">
        {template.sections.map((section, index) => (
          <section
            key={section.id}
            className="rounded-xl border border-border bg-card p-4"
          >
            <form action={updateSectionAction} className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input type="hidden" name="id" value={section.id} />
              <input type="hidden" name="locale" value={template.locale} />
              <input type="hidden" name="titleEn" value={section.titleEn} />
              <input type="hidden" name="titleEs" value={section.titleEs} />
              <div className="space-y-1.5">
                <Label>Section</Label>
                <Input name="title" defaultValue={sectionTitle(section, template.locale)} required />
              </div>
              <div className="flex items-end">
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

            <ul className="mt-4 space-y-2 border-t border-border pt-4">
              {section.items.map((item, itemIndex) => (
                <li key={item.id} className="rounded-lg bg-muted/40 p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <form
                      action={updateItemAction}
                      className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="locale" value={template.locale} />
                      <input type="hidden" name="titleEn" value={item.titleEn} />
                      <input type="hidden" name="titleEs" value={item.titleEs} />
                      <Input
                        name="title"
                        defaultValue={itemTitle(item, template.locale)}
                        required
                        className="min-w-36 flex-1"
                      />
                      <select
                        name="itemType"
                        defaultValue={item.itemType}
                        className="h-8 w-28 shrink-0 rounded-lg border border-input bg-background px-2 text-sm"
                      >
                        <option value="mark">Mark (dropdown)</option>
                        <option value="comment">Comment</option>
                      </select>
                      {item.itemType === "mark" ? (
                        <select
                          name="gradeScaleId"
                          defaultValue={item.gradeScaleId ?? template.gradeScaleId ?? scales[0]?.id}
                          className="h-8 w-36 shrink-0 rounded-lg border border-input bg-background px-2 text-sm"
                          aria-label="Grade scale"
                        >
                          {scales.map((scale) => (
                            <option key={scale.id} value={scale.id}>
                              {scale.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input type="hidden" name="gradeScaleId" value="" />
                      )}
                      <Input
                        name="printCode"
                        defaultValue={item.printCode ?? ""}
                        placeholder="01"
                        aria-label="Print code"
                        className="w-16 font-mono"
                      />
                      {item.itemType === "comment" ? (
                        <Input
                          name="maxChars"
                          type="number"
                          min={20}
                          max={4000}
                          defaultValue={item.maxChars ?? 500}
                          placeholder="Chars"
                          className="w-16 shrink-0"
                        />
                      ) : (
                        <input type="hidden" name="maxChars" value="" />
                      )}
                      <IconActionButton label="Save item" action="save" variant="outline" />
                    </form>
                    <div className="flex shrink-0 items-center gap-1">
                      <form action={moveItemAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="direction" value="up" />
                        <IconActionButton
                          label="Move up"
                          action="up"
                          disabled={itemIndex === 0}
                        />
                      </form>
                      <form action={moveItemAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="direction" value="down" />
                        <IconActionButton
                          label="Move down"
                          action="down"
                          disabled={itemIndex === section.items.length - 1}
                        />
                      </form>
                      <form action={deleteItemAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <IconActionButton label="Remove" action="remove" variant="destructive" />
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <form action={addItemAction} className="mt-3 grid gap-2 sm:grid-cols-6">
              <input type="hidden" name="sectionId" value={section.id} />
              <input type="hidden" name="locale" value={template.locale} />
              <Input name="title" placeholder="New line item" required />
              <select
                name="itemType"
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                defaultValue="mark"
              >
                <option value="mark">Mark</option>
                <option value="comment">Comment</option>
              </select>
              <select
                name="gradeScaleId"
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                defaultValue={scales[0]?.id}
                aria-label="Grade scale"
              >
                {scales.map((scale) => (
                  <option key={scale.id} value={scale.id}>
                    {scale.name}
                  </option>
                ))}
              </select>
              <Input name="printCode" placeholder="01" aria-label="Print code" className="font-mono" />
              <Input name="maxChars" type="number" min={20} placeholder="Chars (comments)" />
              <Button type="submit" variant="secondary">
                Add item
              </Button>
            </form>
          </section>
        ))}
      </div>

      <form
        action={addSectionAction}
        className="mt-6 grid gap-2 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2"
      >
        <input type="hidden" name="templateId" value={template.id} />
        <input type="hidden" name="locale" value={template.locale} />
        <Input name="title" placeholder="New section" required />
        <Button type="submit" variant="outline">
          Add section
        </Button>
      </form>
        </DocumentHtmlEditor>
      </div>

      {template.html.trim() ? null : (
        <div className="mb-10">
          <h2 className="font-heading mb-3 text-xl">Report card preview</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Used when HTML is empty. Printed cards then use the built-in PDF.
          </p>
          <ReportCardPreview template={template} />
        </div>
      )}
    </div>
  );
}
