import type { TemplateLayout } from "@/lib/types";

export function defaultLayout(): TemplateLayout {
  return {
    headerFields: {
      student: true,
      id: true,
      grade: true,
      school: true,
      term: true,
      year: true,
      course: true,
    },
    commentsPlacement: "inline",
    table: {
      showMarkCode: true,
      showMarkLabel: true,
      density: "compact",
      markColumnWidth: "narrow",
    },
  };
}

export function normalizeLayout(input?: Partial<TemplateLayout> | null): TemplateLayout {
  const base = defaultLayout();
  if (!input) return base;
  return {
    headerFields: { ...base.headerFields, ...input.headerFields },
    commentsPlacement: input.commentsPlacement ?? base.commentsPlacement,
    table: { ...base.table, ...input.table },
  };
}
