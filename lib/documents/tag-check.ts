import { itemTitle } from "@/lib/data/template-doc";
import {
  isNamedPrintCode,
  parsePrintLineNumber,
  termCountForStructure,
  termMergeTag,
} from "@/lib/documents/print-code";
import { NAMED_TAGS } from "@/lib/documents/tags";
import type { TemplateDetail, TermStructure } from "@/lib/types";

const TAG = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

export function extractMergeTagKeys(html: string): string[] {
  const keys = new Set<string>();
  for (const match of html.matchAll(TAG)) {
    if (match[1]) keys.add(match[1]);
  }
  return [...keys];
}

function attendanceKeys(structure: TermStructure): string[] {
  const count = termCountForStructure(structure);
  const keys: string[] = [];
  for (let n = 1; n <= count; n++) {
    keys.push(`${n}A`, `${n}T`);
  }
  return keys;
}

function formatTag(key: string) {
  return `{{${key}}}`;
}

export type MergeTagGroup = {
  label: string;
  tags: string[];
};

export type MergeTagCheck = {
  unknown: string[];
  unused: MergeTagGroup[];
  partial: MergeTagGroup[];
};

export function checkMergeTags(html: string, template: TemplateDetail): MergeTagCheck {
  const used = new Set(extractMergeTagKeys(html));
  const known = new Set<string>([...NAMED_TAGS, ...attendanceKeys(template.termStructure)]);
  const groups: { label: string; keys: string[] }[] = [];

  for (const section of template.sections) {
    for (const item of section.items) {
      const code = item.printCode?.trim();
      if (!code) continue;
      const named = code.toUpperCase();
      if (isNamedPrintCode(named)) {
        const key = named === "ILP_GOAL" ? "ILP_GOAL_TEXT" : named;
        known.add(key);
        groups.push({
          label: `${named} · ${itemTitle(item, template.locale)}`,
          keys: [key],
        });
        continue;
      }
      const line = parsePrintLineNumber(code);
      if (line == null) continue;
      const keys = Array.from({ length: termCountForStructure(template.termStructure) }, (_, index) =>
        termMergeTag(line, index),
      );
      for (const key of keys) known.add(key);
      groups.push({
        label: `Line ${String(line).padStart(2, "0")} · ${itemTitle(item, template.locale)}`,
        keys,
      });
    }
  }

  const unknown = [...used].filter((key) => !known.has(key)).sort();
  const unused: MergeTagGroup[] = [];
  const partial: MergeTagGroup[] = [];

  for (const group of groups) {
    const present = group.keys.filter((key) => used.has(key));
    const missing = group.keys.filter((key) => !used.has(key));
    if (present.length === 0) {
      unused.push({ label: group.label, tags: group.keys.map(formatTag) });
    } else if (missing.length > 0) {
      partial.push({ label: group.label, tags: missing.map(formatTag) });
    }
  }

  return {
    unknown: unknown.map(formatTag),
    unused,
    partial,
  };
}

export function hasMergeTagIssues(check: MergeTagCheck) {
  return check.unknown.length > 0 || check.unused.length > 0 || check.partial.length > 0;
}
