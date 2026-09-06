"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { saveTemplateLayoutAction } from "@/lib/actions/mutations";
import {
  BODY_PX,
  isDarkHex,
  layoutFooter,
  layoutTitle,
  mixHex,
  normalizeLayout,
  TITLE_PX,
} from "@/lib/data/layout";
import type { Locale, TemplateDetail, TemplateLayout, TypeSize } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

type LayoutPatch = {
  commentsPlacement?: TemplateLayout["commentsPlacement"];
  headerFields?: Partial<TemplateLayout["headerFields"]>;
  table?: Partial<TemplateLayout["table"]>;
  copy?: Partial<TemplateLayout["copy"]>;
  type?: Partial<TemplateLayout["type"]>;
  colors?: Partial<TemplateLayout["colors"]>;
};

export function ReportCardPreview({ template }: { template: TemplateDetail }) {
  const [layout, setLayout] = useState<TemplateLayout>(() =>
    normalizeLayout(template.layout),
  );
  const [locale, setLocale] = useState<Locale>("en");
  const [saving, setSaving] = useState(false);

  function patch(next: LayoutPatch) {
    setLayout((prev) =>
      normalizeLayout({
        ...prev,
        ...next,
        headerFields: { ...prev.headerFields, ...next.headerFields },
        table: { ...prev.table, ...next.table },
        copy: { ...prev.copy, ...next.copy },
        type: { ...prev.type, ...next.type },
        colors: { ...prev.colors, ...next.colors },
      }),
    );
  }

  async function save() {
    setSaving(true);
    try {
      await saveTemplateLayoutAction(template.id, layout);
      toast.success("Style saved. Printed cards will match this preview.");
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
  const { colors, table } = layout;
  const titlePx = TITLE_PX[layout.type.titleSize];
  const bodyPx = BODY_PX[layout.type.bodySize];
  const muted = mixHex(colors.ink, colors.page, 0.42);
  const bandFg = isDarkHex(colors.band) ? "#ffffff" : colors.ink;
  const markPct = 100 - table.criterionWidth;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="space-y-5 rounded-xl border border-border bg-card p-4 text-sm lg:sticky lg:top-4">
        <div>
          <h2 className="font-heading text-lg">Style</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Colors, type, and copy apply to this preview and to printed PDFs.
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="font-medium">Copy</legend>
          <CopyField
            id="style-title-en"
            label="Title (English)"
            value={layout.copy.titleEn}
            placeholder="Progress report"
            onChange={(titleEn) => patch({ copy: { titleEn } })}
          />
          <CopyField
            id="style-title-es"
            label="Title (Spanish)"
            value={layout.copy.titleEs}
            placeholder="Informe de progreso"
            onChange={(titleEs) => patch({ copy: { titleEs } })}
          />
          <CopyField
            id="style-footer-en"
            label="Footer (English)"
            value={layout.copy.footerEn}
            placeholder="Generated from the Northside gradebook"
            onChange={(footerEn) => patch({ copy: { footerEn } })}
          />
          <CopyField
            id="style-footer-es"
            label="Footer (Spanish)"
            value={layout.copy.footerEs}
            placeholder="Generado desde el libro de calificaciones de Northside"
            onChange={(footerEs) => patch({ copy: { footerEs } })}
          />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-medium">Type</legend>
          <SizeSelect
            id="style-title-size"
            label="Title size"
            value={layout.type.titleSize}
            onChange={(titleSize) => patch({ type: { titleSize } })}
          />
          <SizeSelect
            id="style-body-size"
            label="Body size"
            value={layout.type.bodySize}
            onChange={(bodySize) => patch({ type: { bodySize } })}
          />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-medium">Color</legend>
          <ColorField
            label="Page"
            value={colors.page}
            onChange={(page) => patch({ colors: { page } })}
          />
          <ColorField
            label="Text"
            value={colors.ink}
            onChange={(ink) => patch({ colors: { ink } })}
          />
          <ColorField
            label="Section band"
            value={colors.band}
            onChange={(band) => patch({ colors: { band } })}
          />
          <ColorField
            label="Borders"
            value={colors.border}
            onChange={(border) => patch({ colors: { border } })}
          />
          <ColorField
            label="Accent"
            value={colors.accent}
            onChange={(accent) => patch({ colors: { accent } })}
          />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-medium">Columns</legend>
          <label className="block">
            <span className="text-xs text-muted-foreground">
              Criterion {table.criterionWidth}% · Mark {markPct}%
            </span>
            <input
              id="style-criterion-width"
              type="range"
              min={50}
              max={85}
              step={1}
              value={table.criterionWidth}
              aria-label="Criterion column width"
              className="mt-2 w-full accent-primary"
              onChange={(e) =>
                patch({ table: { criterionWidth: Number(e.target.value) } })
              }
              onInput={(e) =>
                patch({ table: { criterionWidth: Number((e.target as HTMLInputElement).value) } })
              }
            />
          </label>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-medium">Table</legend>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={table.showMarkCode}
              onChange={(e) => patch({ table: { showMarkCode: e.target.checked } })}
            />
            Show mark code
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={table.showMarkLabel}
              onChange={(e) => patch({ table: { showMarkLabel: e.target.checked } })}
            />
            Show mark label
          </label>
          <label className="flex items-center gap-2">
            <input
              id="style-outer-border"
              type="checkbox"
              checked={table.showOuterBorder}
              onChange={(e) => patch({ table: { showOuterBorder: e.target.checked } })}
            />
            Full table border
          </label>
          <label className="block">
            Density
            <select
              className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              value={table.density}
              onChange={(e) =>
                patch({ table: { density: e.target.value as TemplateLayout["table"]["density"] } })
              }
            >
              <option value="compact">Compact</option>
              <option value="spacious">Spacious</option>
            </select>
          </label>
        </fieldset>

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

        <div className="flex flex-wrap gap-2">
          <Button
            id="style-locale-toggle"
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setLocale(locale === "en" ? "es" : "en")}
          >
            {locale === "en" ? "Preview in Spanish" : "Preview in English"}
          </Button>
          <Button
            id="style-save"
            type="button"
            size="sm"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save layout"}
          </Button>
        </div>
      </div>

      <div
        data-testid="style-preview-card"
        className="rounded-xl border border-border p-5 shadow-inner"
        style={{ backgroundColor: colors.page, color: colors.ink, fontSize: bodyPx }}
      >
        <p
          className="text-[10px] tracking-[0.14em] uppercase"
          style={{ color: muted }}
        >
          {locale === "es" ? "Distrito Escolar Unificado de Northside" : "Northside Unified School District"}
        </p>
        <h3
          data-testid="style-preview-title"
          className="font-heading mt-1 leading-tight"
          style={{ fontSize: titlePx, color: colors.ink }}
        >
          {layoutTitle(layout, locale)}
        </h3>
        <div className="mt-2 mb-3 h-0.5 w-16" style={{ backgroundColor: colors.accent }} />
        <p className="mb-3" style={{ color: muted, fontSize: bodyPx }}>
          {template.name}
        </p>
        {visibleHeader.length > 0 ? (
          <div
            className="mb-3 grid grid-cols-2 sm:grid-cols-4"
            style={{
              border: `1px solid ${colors.border}`,
            }}
          >
            {visibleHeader.map((cell, i) => (
              <div
                key={cell.key}
                className="p-2"
                style={{
                  borderRight:
                    i === visibleHeader.length - 1 ? undefined : `1px solid ${colors.border}`,
                }}
              >
                <p className="text-[10px] tracking-wide uppercase" style={{ color: muted }}>
                  {cell.label}
                </p>
                <p className="font-semibold" style={{ fontSize: bodyPx }}>
                  {cell.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mb-3 flex flex-wrap gap-4" style={{ fontSize: bodyPx }}>
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
              <p
                className="px-2 py-1 text-xs font-semibold"
                style={{ backgroundColor: colors.band, color: bandFg }}
              >
                {locale === "es" ? section.titleEs : section.titleEn}
              </p>
              <div
                style={
                  table.showOuterBorder
                    ? { border: `1px solid ${colors.border}`, borderTop: "none" }
                    : undefined
                }
              >
                {marksInSection.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between px-2",
                      table.density === "spacious" ? "py-2.5" : "py-1",
                    )}
                    style={{ borderBottom: `1px solid ${colors.border}` }}
                  >
                    <span style={{ width: `${table.criterionWidth}%`, fontSize: bodyPx }}>
                      {locale === "es" ? item.titleEs : item.titleEn}
                    </span>
                    <span
                      className="text-right font-semibold"
                      style={{ width: `${markPct}%`, fontSize: bodyPx }}
                    >
                      {table.showMarkCode ? sampleMark?.code : ""}
                      {table.showMarkCode && table.showMarkLabel ? "  " : ""}
                      {table.showMarkLabel
                        ? locale === "es"
                          ? sampleMark?.labelEs
                          : sampleMark?.labelEn
                        : ""}
                      {!table.showMarkCode && !table.showMarkLabel ? "—" : ""}
                    </span>
                  </div>
                ))}
              </div>
              {showCommentsHere
                ? commentsInSection.map((item) => (
                    <div key={item.id} className="px-2 py-2" style={{ fontSize: bodyPx }}>
                      <p className="font-medium">
                        {locale === "es" ? item.titleEs : item.titleEn}
                        {item.maxChars ? (
                          <span className="ml-2 text-xs font-normal" style={{ color: muted }}>
                            {item.maxChars} characters
                          </span>
                        ) : null}
                      </p>
                      <p style={{ color: muted }}>
                        Sample: Building reading stamina in small group.
                      </p>
                    </div>
                  ))
                : null}
            </div>
          );
        })}

        {layout.commentsPlacement === "bottom" && comments.length > 0 ? (
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
            <p className="text-xs font-semibold tracking-wide uppercase">
              {locale === "es" ? "Comentarios" : "Comments"}
            </p>
            {comments.map((item) => (
              <div key={item.id} className="mt-2" style={{ fontSize: bodyPx }}>
                <p className="font-medium">
                  {locale === "es" ? item.titleEs : item.titleEn}
                  {item.maxChars ? (
                    <span className="ml-2 text-xs font-normal" style={{ color: muted }}>
                      max {item.maxChars}
                    </span>
                  ) : null}
                </p>
                <p style={{ color: muted }}>Sample: Building reading stamina in small group.</p>
              </div>
            ))}
          </div>
        ) : null}

        <p className="mt-4 text-[11px]" style={{ color: muted }}>
          {template.marks
            .map((m) => `${m.code} = ${locale === "es" ? m.labelEs : m.labelEn}`)
            .join("   ·   ")}
        </p>
        <div className="mt-6 flex justify-between gap-8 text-[10px]" style={{ color: muted }}>
          <p className="w-40 border-t pt-1" style={{ borderColor: colors.accent }}>
            {locale === "es" ? "Firma del maestro" : "Teacher signature"}
          </p>
          <p className="w-40 border-t pt-1" style={{ borderColor: colors.accent }}>
            {locale === "es" ? "Firma del padre / tutor" : "Parent / guardian signature"}
          </p>
        </div>
        <p className="mt-6 text-[11px]" style={{ color: muted }}>
          {layoutFooter(layout, locale)}
        </p>
        <p className="sr-only">{markItems.length} mark items in preview</p>
      </div>
    </div>
  );
}

function CopyField({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  );
}

function SizeSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: TypeSize;
  onChange: (value: TypeSize) => void;
}) {
  return (
    <label className="block" htmlFor={id}>
      {label}
      <select
        id={id}
        className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value as TypeSize)}
      >
        <option value="sm">Small</option>
        <option value="md">Medium</option>
        <option value="lg">Large</option>
      </select>
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const slug = label.toLowerCase().replace(/\s+/g, "-");
  const [text, setText] = useState(value);
  useEffect(() => {
    setText(value);
  }, [value]);

  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          id={`style-color-${slug}`}
          type="color"
          aria-label={`${label} color`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 shrink-0 cursor-pointer rounded border border-input bg-background p-0.5"
        />
        <input
          id={`style-hex-${slug}`}
          type="text"
          spellCheck={false}
          value={text}
          aria-label={`${label} hex`}
          className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 font-mono text-xs"
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            if (/^#[0-9a-f]{6}$/i.test(next.trim())) onChange(next.trim());
          }}
          onInput={(e) => {
            const next = (e.target as HTMLInputElement).value;
            setText(next);
            if (/^#[0-9a-f]{6}$/i.test(next.trim())) onChange(next.trim());
          }}
          onBlur={() => {
            if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(text.trim())) {
              onChange(text.trim());
            } else {
              setText(value);
            }
          }}
        />
      </div>
    </label>
  );
}
