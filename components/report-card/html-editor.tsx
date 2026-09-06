"use client";

import { type ReactNode, useMemo, useState } from "react";
import { toast } from "sonner";
import { saveTemplateHtmlAction } from "@/lib/actions/mutations";
import { localeLabel } from "@/lib/data/template-doc";
import { TERM_STRUCTURE_NAMES } from "@/lib/data/terms";
import { mergeDocument, mergeDocumentShowTags, sampleMergeValues } from "@/lib/documents/merge";
import { checkMergeTags, hasMergeTagIssues } from "@/lib/documents/tag-check";
import { TAG_HELP } from "@/lib/documents/tags";
import type { TemplateDetail } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function DocumentHtmlEditor({
  template,
  children,
}: {
  template: TemplateDetail;
  children?: ReactNode;
}) {
  const [html, setHtml] = useState(template.html ?? "");
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"student" | "tags">("student");
  const sample = useMemo(() => sampleMergeValues(template), [template]);
  const preview = html.trim()
    ? previewMode === "tags"
      ? mergeDocumentShowTags(html)
      : mergeDocument(html, sample)
    : "";
  const itemCount = template.sections.reduce((n, section) => n + section.items.length, 0);
  const tagIssues = useMemo(
    () => (html.trim() ? checkMergeTags(html, template) : null),
    [html, template],
  );

  async function save() {
    setSaving(true);
    try {
      await saveTemplateHtmlAction(template.id, html);
      toast.success("HTML saved. Printed cards will use this document.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save HTML.");
    } finally {
      setSaving(false);
    }
  }

  function insert(tag: string) {
    setHtml((prev) => `${prev}${tag}`);
  }

  const previewFrame = preview ? (
    <iframe
      title="Report card HTML preview"
      sandbox=""
      srcDoc={preview}
      className="h-[min(80vh,52rem)] w-full rounded-xl border border-border bg-muted"
    />
  ) : (
    <p className="rounded-xl border border-dashed border-border px-4 py-10 text-sm text-muted-foreground">
      Paste HTML to preview this card with the line items on the template. Term 1 shows sample
      marks; later terms stay blank.
    </p>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h2 className="font-heading text-xl">{localeLabel(template.locale)} HTML document</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste the {localeLabel(template.locale).toLowerCase()} layout for a{" "}
            {TERM_STRUCTURE_NAMES[template.termStructure].toLowerCase()} year. School and year
            tags fill from the course. The preview uses this template’s {itemCount} line items
            (line 01 → 101 / 201 / 301). Scripts are stripped on save.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save HTML"}
          </Button>
        </div>

        <details className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium">Merge tags</summary>
          <ul className="mt-2 space-y-1 text-xs">
            {TAG_HELP.map((row) => (
              <li key={row.tag} className="flex flex-wrap items-baseline gap-2">
                <button
                  type="button"
                  className="font-mono text-primary hover:underline"
                  onClick={() => insert(row.tag.split(" ")[0] ?? row.tag)}
                >
                  {row.tag}
                </button>
                <span className="text-muted-foreground">{row.meaning}</span>
              </li>
            ))}
          </ul>
        </details>

        <div className="space-y-1.5">
          <Label htmlFor="document-html">Source</Label>
          <textarea
            id="document-html"
            spellCheck={false}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="min-h-64 w-full rounded-xl border border-input bg-background p-3 font-mono text-xs leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder="<!DOCTYPE html>…"
          />
        </div>

        {tagIssues && hasMergeTagIssues(tagIssues) ? (
          <div className="space-y-2">
            {tagIssues.unknown.length > 0 ? (
              <Alert variant="destructive">
                <AlertTitle>Tags that will not fill</AlertTitle>
                <AlertDescription>
                  No line item or field matches{" "}
                  <span className="font-mono">{tagIssues.unknown.join(" ")}</span>. They print
                  blank.
                </AlertDescription>
              </Alert>
            ) : null}
            {tagIssues.unused.length > 0 ? (
              <Alert>
                <AlertTitle>
                  {tagIssues.unused.length === 1
                    ? "1 line item is not used in the HTML"
                    : `${tagIssues.unused.length} line items are not used in the HTML`}
                </AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto text-xs">
                    {tagIssues.unused.map((row) => (
                      <li key={row.label}>
                        {row.label}
                        <span className="ml-1.5 font-mono">{row.tags.join(" ")}</span>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}
            {tagIssues.partial.length > 0 ? (
              <Alert>
                <AlertTitle>Missing term tags</AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto text-xs">
                    {tagIssues.partial.map((row) => (
                      <li key={row.label}>
                        {row.label} is missing{" "}
                        <span className="font-mono">{row.tags.join(" ")}</span>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        ) : null}

        <aside>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">Preview</p>
            <div className="flex rounded-lg border border-border p-0.5">
              <Button
                type="button"
                size="xs"
                variant={previewMode === "student" ? "default" : "ghost"}
                onClick={() => setPreviewMode("student")}
              >
                Sample student
              </Button>
              <Button
                type="button"
                size="xs"
                variant={previewMode === "tags" ? "default" : "ghost"}
                onClick={() => setPreviewMode("tags")}
              >
                {"{{101}} tags"}
              </Button>
            </div>
          </div>
          <p className="mb-1.5 text-xs text-muted-foreground">
            {previewMode === "tags"
              ? "Shows the merge tags in place — line 01 is {{101}}, {{201}}, {{301}}."
              : itemCount
                ? `${itemCount} line items · term 1 filled with sample marks`
                : "Term 1 filled with sample marks"}
          </p>
          {previewFrame}
        </aside>
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
