"use client";

import { useState } from "react";
import { toast } from "sonner";
import { saveTemplateLayoutAction } from "@/lib/actions/mutations";
import { normalizeLayout } from "@/lib/data/layout";
import type { Locale, TemplateDetail, TemplateLayout } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SAMPLE = {
  student: "Sofia Alvarez",
  id: "20260001",
  grade: "Grade 3",
  school: "Maple Elementary",
  term: "Trimester 1",
  year: "2026–27",
  course: "Grade 3 Homeroom — Shah",
};

export function ReportCardPreview({ template }: { template: TemplateDetail }) {
  const [layout, setLayout] = useState<TemplateLayout>(() =>
    normalizeLayout(template.layout),
  );
  const [locale, setLocale] = useState<Locale>("en");
  const [saving, setSaving] = useState(false);

  function patch(next: Partial<TemplateLayout> | { headerFields?: Partial<TemplateLayout["headerFields"]>; table?: Partial<TemplateLayout["table"]> }) {
    setLayout((prev) =>
      normalizeLayout({
        ...prev,
        ...next,
        headerFields: { ...prev.headerFields, ...next.headerFields },
        table: { ...prev.table, ...next.table },
      }),
    );
  }

  async function save() {
    setSaving(true);
    try {
      await saveTemplateLayoutAction(template.id, layout);
      toast.success("Preview layout saved. Printed cards will match.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save layout.");
    } finally {
      setSaving(false);
    }
  }

  const header: { key: keyof TemplateLayout["headerFields"]; label: string; value: string }[] = [
    { key: "student", label: locale === "es" ? "Estudiante" : "Student", value: SAMPLE.student },
    { key: "id", label: locale === "es" ? "Número" : "Student ID", value: SAMPLE.id },
    { key: "grade", label: locale === "es" ? "Grado" : "Grade", value: locale === "es" ? "3.° grado" : SAMPLE.grade },
    { key: "school", label: locale === "es" ? "Escuela" : "School", value: SAMPLE.school },
  ];
  const visibleHeader = header.filter((h) => layout.headerFields[h.key]);
  const markItems = template.sections.flatMap((s) =>
    s.items.filter((i) => i.itemType === "mark").map((item) => ({ ...item, section: s })),
  );
  const comments = template.sections.flatMap((s) =>
    s.items.filter((i) => i.itemType === "comment"),
  );
  const sampleMark = template.marks[1] ?? template.marks[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,20rem)_1fr]">
      <div className="space-y-4 rounded-xl border border-border bg-card p-4 text-sm">
        <h2 className="font-heading text-lg">Preview options</h2>
        <fieldset className="space-y-2">
          <legend className="font-medium">Header fields</legend>
          {(
            [
              ["student", "Student"],
              ["id", "Student ID"],
              ["grade", "Grade"],
              ["school", "School"],
              ["term", "Term"],
              ["year", "Year"],
              ["course", "Course"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={layout.headerFields[key]}
                onChange={(e) =>
                  patch({ headerFields: { [key]: e.target.checked } })
                }
              />
              {label}
            </label>
          ))}
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="font-medium">Comments</legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="comments"
              checked={layout.commentsPlacement === "inline"}
              onChange={() => patch({ commentsPlacement: "inline" })}
            />
            Inline with each section
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="comments"
              checked={layout.commentsPlacement === "bottom"}
              onChange={() => patch({ commentsPlacement: "bottom" })}
            />
            All comments at the bottom
          </label>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="font-medium">Marks table</legend>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={layout.table.showMarkCode}
              onChange={(e) => patch({ table: { showMarkCode: e.target.checked } })}
            />
            Show mark code
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={layout.table.showMarkLabel}
              onChange={(e) => patch({ table: { showMarkLabel: e.target.checked } })}
            />
            Show mark label
          </label>
          <label className="block">
            Density
            <select
              className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              value={layout.table.density}
              onChange={(e) =>
                patch({ table: { density: e.target.value as TemplateLayout["table"]["density"] } })
              }
            >
              <option value="compact">Compact</option>
              <option value="spacious">Spacious</option>
            </select>
          </label>
          <label className="block">
            Mark column
            <select
              className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              value={layout.table.markColumnWidth}
              onChange={(e) =>
                patch({
                  table: {
                    markColumnWidth: e.target.value as TemplateLayout["table"]["markColumnWidth"],
                  },
                })
              }
            >
              <option value="narrow">Narrow</option>
              <option value="wide">Wide</option>
            </select>
          </label>
        </fieldset>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setLocale(locale === "en" ? "es" : "en")}>
            {locale === "en" ? "Preview in Spanish" : "Preview in English"}
          </Button>
          <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save layout"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-[#f7f4ee] p-5 text-[#1f2a44] shadow-inner">
        <p className="text-[10px] tracking-[0.14em] text-[#5c6b86] uppercase">
          {locale === "es" ? "Distrito Escolar Unificado de Northside" : "Northside Unified School District"}
        </p>
        <h3 className="font-heading mt-1 text-2xl">
          {locale === "es" ? "Informe de progreso" : "Progress report"}
        </h3>
        <p className="mb-3 text-sm text-[#3d4a63]">{template.name}</p>
        {visibleHeader.length > 0 ? (
          <div className="mb-3 grid grid-cols-2 border border-[#c9d0dc] sm:grid-cols-4">
            {visibleHeader.map((cell) => (
              <div key={cell.key} className="border-r border-[#c9d0dc] p-2 last:border-r-0">
                <p className="text-[10px] tracking-wide text-[#5c6b86] uppercase">{cell.label}</p>
                <p className="text-sm font-semibold">{cell.value}</p>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mb-3 flex flex-wrap gap-4 text-sm">
          {layout.headerFields.term ? (
            <span>
              {locale === "es" ? "Periodo" : "Term"}: {SAMPLE.term}
            </span>
          ) : null}
          {layout.headerFields.year ? (
            <span>
              {locale === "es" ? "Año" : "Year"}: {SAMPLE.year}
            </span>
          ) : null}
          {layout.headerFields.course ? <span>{SAMPLE.course}</span> : null}
        </div>

        {template.sections.map((section) => {
          const marksInSection = section.items.filter((i) => i.itemType === "mark");
          const commentsInSection = section.items.filter((i) => i.itemType === "comment");
          const showCommentsHere =
            layout.commentsPlacement === "inline" && commentsInSection.length > 0;
          if (marksInSection.length === 0 && !showCommentsHere) return null;
          return (
            <div key={section.id} className="mb-3">
              <p className="bg-[#eef2f7] px-2 py-1 text-xs font-semibold">
                {locale === "es" ? section.titleEs : section.titleEn}
              </p>
              {marksInSection.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between border-b border-[#d5dbe6] px-2",
                    layout.table.density === "spacious" ? "py-2.5" : "py-1",
                  )}
                >
                  <span className="text-sm">
                    {locale === "es" ? item.titleEs : item.titleEn}
                  </span>
                  <span
                    className={cn(
                      "text-right text-sm font-semibold",
                      layout.table.markColumnWidth === "wide" ? "w-40" : "w-24",
                    )}
                  >
                    {layout.table.showMarkCode ? sampleMark?.code : ""}
                    {layout.table.showMarkCode && layout.table.showMarkLabel ? "  " : ""}
                    {layout.table.showMarkLabel
                      ? locale === "es"
                        ? sampleMark?.labelEs
                        : sampleMark?.labelEn
                      : ""}
                    {!layout.table.showMarkCode && !layout.table.showMarkLabel ? "—" : ""}
                  </span>
                </div>
              ))}
              {showCommentsHere
                ? commentsInSection.map((item) => (
                    <div key={item.id} className="px-2 py-2 text-sm">
                      <p className="font-medium">
                        {locale === "es" ? item.titleEs : item.titleEn}
                        {item.maxChars ? (
                          <span className="ml-2 text-xs font-normal text-[#5c6b86]">
                            {item.maxChars} characters
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[#3d4a63]">
                        Sample: Building reading stamina in small group.
                      </p>
                    </div>
                  ))
                : null}
            </div>
          );
        })}

        {layout.commentsPlacement === "bottom" && comments.length > 0 ? (
          <div className="mt-4 border-t border-[#c9d0dc] pt-3">
            <p className="text-xs font-semibold tracking-wide uppercase">
              {locale === "es" ? "Comentarios" : "Comments"}
            </p>
            {comments.map((item) => (
              <div key={item.id} className="mt-2 text-sm">
                <p className="font-medium">
                  {locale === "es" ? item.titleEs : item.titleEn}
                  {item.maxChars ? (
                    <span className="ml-2 text-xs font-normal text-[#5c6b86]">
                      max {item.maxChars}
                    </span>
                  ) : null}
                </p>
                <p className="text-[#3d4a63]">Sample: Building reading stamina in small group.</p>
              </div>
            ))}
          </div>
        ) : null}

        <p className="mt-4 text-[11px] text-[#5c6b86]">
          {template.marks
            .map((m) => `${m.code} = ${locale === "es" ? m.labelEs : m.labelEn}`)
            .join("   ·   ")}
        </p>
        <p className="sr-only">{markItems.length} mark items in preview</p>
      </div>
    </div>
  );
}
