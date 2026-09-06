import type { Locale, TemplateLayout, TypeSize } from "@/lib/types";

const SIZES: TypeSize[] = ["sm", "md", "lg"];
const HEX3 = /^#([0-9a-f]{3})$/i;
const HEX6 = /^#([0-9a-f]{6})$/i;

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
    copy: {
      titleEn: "",
      titleEs: "",
      footerEn: "",
      footerEs: "",
    },
    type: {
      titleSize: "md",
      bodySize: "md",
    },
    colors: {
      page: "#f7f4ee",
      ink: "#1f2a44",
      band: "#eef2f7",
      border: "#c9d0dc",
      accent: "#3d4f7a",
    },
    table: {
      showMarkCode: true,
      showMarkLabel: true,
      density: "compact",
      markColumnWidth: "narrow",
      criterionWidth: 70,
      showOuterBorder: false,
    },
  };
}

function clampWidth(value: unknown, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(85, Math.max(50, Math.round(n)));
}

function sizeOf(value: unknown, fallback: TypeSize): TypeSize {
  return SIZES.includes(value as TypeSize) ? (value as TypeSize) : fallback;
}

function hex(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const raw = value.trim();
  const short = HEX3.exec(raw);
  if (short) {
    const [r, g, b] = short[1];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (HEX6.test(raw)) return raw.toLowerCase();
  return fallback;
}

function str(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

export function isDarkHex(hexValue: string): boolean {
  const n = hex(hexValue, "#000000").slice(1);
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 145;
}

export function mixHex(from: string, toward: string, amount: number): string {
  const a = hex(from, "#000000").slice(1);
  const b = hex(toward, "#ffffff").slice(1);
  const t = Math.min(1, Math.max(0, amount));
  const mix = (i: number) => {
    const x = parseInt(a.slice(i, i + 2), 16);
    const y = parseInt(b.slice(i, i + 2), 16);
    return Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${mix(0)}${mix(2)}${mix(4)}`;
}

export function layoutTitle(layout: TemplateLayout, locale: Locale): string {
  const custom = (locale === "es" ? layout.copy.titleEs : layout.copy.titleEn).trim();
  return custom || (locale === "es" ? "Informe de progreso" : "Progress report");
}

export function layoutFooter(layout: TemplateLayout, locale: Locale): string {
  const custom = (locale === "es" ? layout.copy.footerEs : layout.copy.footerEn).trim();
  return (
    custom ||
    (locale === "es"
      ? "Generado desde el libro de calificaciones de Northside"
      : "Generated from the Northside gradebook")
  );
}

/** Letter page content width after 40pt horizontal padding. */
export const PDF_CONTENT_WIDTH = 532;

export function normalizeLayout(input?: Partial<TemplateLayout> | null): TemplateLayout {
  const base = defaultLayout();
  if (!input) return base;
  const tableIn = input.table ?? base.table;
  let criterionWidth = clampWidth(tableIn.criterionWidth, 0);
  if (!criterionWidth) {
    criterionWidth = tableIn.markColumnWidth === "wide" ? 58 : base.table.criterionWidth;
  }
  return {
    headerFields: { ...base.headerFields, ...input.headerFields },
    commentsPlacement: input.commentsPlacement ?? base.commentsPlacement,
    copy: {
      titleEn: str(input.copy?.titleEn, base.copy.titleEn),
      titleEs: str(input.copy?.titleEs, base.copy.titleEs),
      footerEn: str(input.copy?.footerEn, base.copy.footerEn),
      footerEs: str(input.copy?.footerEs, base.copy.footerEs),
    },
    type: {
      titleSize: sizeOf(input.type?.titleSize, base.type.titleSize),
      bodySize: sizeOf(input.type?.bodySize, base.type.bodySize),
    },
    colors: {
      page: hex(input.colors?.page, base.colors.page),
      ink: hex(input.colors?.ink, base.colors.ink),
      band: hex(input.colors?.band, base.colors.band),
      border: hex(input.colors?.border, base.colors.border),
      accent: hex(input.colors?.accent, base.colors.accent),
    },
    table: {
      ...base.table,
      ...tableIn,
      criterionWidth,
      showOuterBorder: Boolean(tableIn.showOuterBorder),
      markColumnWidth: criterionWidth <= 62 ? "wide" : "narrow",
    },
  };
}

export const TITLE_PX: Record<TypeSize, number> = { sm: 18, md: 24, lg: 30 };
export const BODY_PX: Record<TypeSize, number> = { sm: 12, md: 14, lg: 16 };
export const TITLE_PT: Record<TypeSize, number> = { sm: 14, md: 18, lg: 22 };
export const BODY_PT: Record<TypeSize, number> = { sm: 9, md: 10, lg: 12 };
