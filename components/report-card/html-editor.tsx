"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { saveTemplateHtmlAction } from "@/lib/actions/mutations";
import { mergeDocument, sampleMergeValues } from "@/lib/documents/merge";
import { TAG_HELP } from "@/lib/documents/tags";
import type { Locale, TemplateDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function DocumentHtmlEditor({ template }: { template: TemplateDetail }) {
  const [htmlEn, setHtmlEn] = useState(template.htmlEn ?? "");
  const [htmlEs, setHtmlEs] = useState(template.htmlEs ?? "");
  const [locale, setLocale] = useState<Locale>("en");
  const [saving, setSaving] = useState(false);
  const sample = useMemo(() => sampleMergeValues(), []);

  const source = locale === "es" ? htmlEs || htmlEn : htmlEn;
  const preview = source.trim() ? mergeDocument(source, sample) : "";

  async function save() {
    setSaving(true);
    try {
      await saveTemplateHtmlAction(template.id, htmlEn, htmlEs);
      toast.success("HTML saved. Printed cards will use this document.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save HTML.");
    } finally {
      setSaving(false);
    }
  }

  function insert(tag: string) {
    const setter = locale === "es" ? setHtmlEs : setHtmlEn;
    setter((prev) => `${prev}${tag}`);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl">HTML document</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste PowerSchool-style HTML. Merge tags fill from the gradebook. Scripts are stripped
          on save. Leave blank to keep the built-in PDF.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={locale === "en" ? "default" : "outline"}
          onClick={() => setLocale("en")}
        >
          English HTML
        </Button>
        <Button
          type="button"
          size="sm"
          variant={locale === "es" ? "default" : "outline"}
          onClick={() => setLocale("es")}
        >
          Spanish HTML
        </Button>
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

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="document-html">{locale === "es" ? "Spanish source" : "English source"}</Label>
          <textarea
            id="document-html"
            spellCheck={false}
            value={locale === "es" ? htmlEs : htmlEn}
            onChange={(e) => (locale === "es" ? setHtmlEs(e.target.value) : setHtmlEn(e.target.value))}
            className="min-h-[28rem] w-full rounded-xl border border-input bg-background p-3 font-mono text-xs leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder="<!DOCTYPE html>…"
          />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium">Letter preview (sample student)</p>
          {preview ? (
            <iframe
              title="Report card HTML preview"
              sandbox=""
              srcDoc={preview}
              className="h-[28rem] w-full rounded-xl border border-border bg-muted"
            />
          ) : (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-sm text-muted-foreground">
              No HTML yet. Paste a document to preview merge tags with sample marks.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
