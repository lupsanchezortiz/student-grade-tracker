import { TERM_STRUCTURE_LABELS } from "@/lib/data/terms";
import type { TermStructure } from "@/lib/types";

export const NAMED_PRINT_CODES = [
  "ILP_GOAL",
  "FALL_COMMENTS",
  "WINTER_COMMENTS",
  "SPRING_COMMENTS",
] as const;

export type NamedPrintCode = (typeof NAMED_PRINT_CODES)[number];

const NAMED_SET = new Set<string>(NAMED_PRINT_CODES);

export function isNamedPrintCode(code: string): code is NamedPrintCode {
  return NAMED_SET.has(code.trim().toUpperCase());
}

/** Line number from CSV `01` or a stored 3-digit code like `101`. */
export function parsePrintLineNumber(code: string): number | null {
  const raw = code.trim();
  if (!/^\d{1,3}$/.test(raw)) return null;
  const line = raw.length <= 2 ? Number(raw) : Number(raw) % 100;
  if (!Number.isInteger(line) || line < 1 || line > 99) return null;
  return line;
}

/** Store numeric codes as two digits (`01`); keep named codes uppercase. */
export function normalizePrintCode(code?: string | null): string | undefined {
  const raw = code?.trim();
  if (!raw) return undefined;
  const upper = raw.toUpperCase();
  if (isNamedPrintCode(upper)) return upper;
  const line = parsePrintLineNumber(raw);
  if (line == null) return undefined;
  return String(line).padStart(2, "0");
}

export function printCodesMatch(a?: string | null, b?: string | null): boolean {
  const left = normalizePrintCode(a);
  const right = normalizePrintCode(b);
  return Boolean(left && right && left === right);
}

export function termCountForStructure(structure: TermStructure): number {
  return TERM_STRUCTURE_LABELS[structure].length;
}

/** `termIndex` is 0-based. Line `01` → term 0 is `101`, term 1 is `201`. */
export function termMergeTag(line: number, termIndex: number): string {
  return String((termIndex + 1) * 100 + line);
}

export function previewTermMergeTags(line: number, structure: TermStructure): string[] {
  return Array.from({ length: termCountForStructure(structure) }, (_, index) => {
    return `{{${termMergeTag(line, index)}}}`;
  });
}

export function namedMergeTag(code: NamedPrintCode): string {
  return code === "ILP_GOAL" ? "{{ILP_GOAL_TEXT}}" : `{{${code}}}`;
}

/** Editor preview: `{{101}} {{201}} {{301}}` or a named tag. */
export function printCodePreview(
  code: string | undefined,
  structure: TermStructure,
): string {
  const normalized = normalizePrintCode(code);
  if (!normalized) return "";
  if (isNamedPrintCode(normalized)) return namedMergeTag(normalized);
  const line = parsePrintLineNumber(normalized);
  if (line == null) return "";
  return previewTermMergeTags(line, structure).join(" ");
}
