import { itemScaleId } from "@/lib/data/hydrate";
import type {
  GradeScaleMark,
  Locale,
  StoreState,
  TemplateDetail,
  TemplateItem,
  TemplateSection,
} from "@/lib/types";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Spanish",
};

export function localeLabel(locale: Locale) {
  return LOCALE_LABELS[locale] ?? locale.toUpperCase();
}

export function parseLocale(raw: string): Locale {
  return raw.trim().toLowerCase() === "es" ? "es" : "en";
}

export function itemTitle(item: TemplateItem, locale: Locale) {
  const primary = locale === "es" ? item.titleEs : item.titleEn;
  return primary.trim() || item.titleEn.trim() || item.titleEs.trim();
}

export function sectionTitle(section: TemplateSection, locale: Locale) {
  const primary = locale === "es" ? section.titleEs : section.titleEn;
  return primary.trim() || section.titleEn.trim() || section.titleEs.trim();
}

export function hasHtmlTemplate(html?: string | null) {
  return Boolean(html && html.trim());
}

export function templatesOverlap(
  state: StoreState,
  aId: string,
  bId: string,
) {
  const gradesA = new Set(
    state.templateGradeLevels.filter((x) => x.templateId === aId).map((x) => x.gradeLevelId),
  );
  return state.templateGradeLevels.some(
    (x) => x.templateId === bId && gradesA.has(x.gradeLevelId),
  );
}

export function siblingTemplates(state: StoreState, templateId: string) {
  const source = state.templates.find((t) => t.id === templateId);
  if (!source) return [];
  return state.templates.filter((t) => {
    if (t.id === source.id) return false;
    if (t.termStructure !== source.termStructure) return false;
    if (t.sourceTemplateId === source.id || source.sourceTemplateId === t.id) return true;
    if (t.sourceTemplateId && t.sourceTemplateId === source.sourceTemplateId) return true;
    return templatesOverlap(state, source.id, t.id);
  });
}

export function marksForItem(template: TemplateDetail, item: TemplateItem): GradeScaleMark[] {
  const scaleId = itemScaleId(item, template.gradeScaleId ?? template.scale.id);
  if (!scaleId) return [];
  return template.marksByScaleId[scaleId] ?? template.marks.filter((m) => m.scaleId === scaleId);
}

export function pairItemIds(course: TemplateDetail, document: TemplateDetail) {
  const courseItems = course.sections.flatMap((s) => s.items);
  const documentItems = document.sections.flatMap((s) => s.items);
  const byCode = new Map<string, string>();
  for (const item of courseItems) {
    const code = item.printCode?.trim().toLowerCase();
    if (code) byCode.set(code, item.id);
  }
  const courseToDocument = new Map<string, string>();
  const documentToCourse = new Map<string, string>();
  documentItems.forEach((item, index) => {
    const code = item.printCode?.trim().toLowerCase();
    const courseId = (code && byCode.get(code)) || courseItems[index]?.id;
    if (!courseId) return;
    courseToDocument.set(courseId, item.id);
    documentToCourse.set(item.id, courseId);
  });
  return { courseToDocument, documentToCourse };
}
