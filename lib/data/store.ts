import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { normalizeLayout } from "@/lib/data/layout";
import { createSeedState } from "@/lib/data/seed";
import { parseLocale } from "@/lib/data/template-doc";
import { parseTermStructure } from "@/lib/data/terms";
import {
  ensureKindergarten,
  ensureKindergartenScales,
  ensureSpecialistGrading,
} from "@/lib/documents/kindergarten";
import { normalizePrintCode } from "@/lib/documents/print-code";
import type { ReportCardTemplate, StoreState } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

let memory: StoreState | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function loadState(): StoreState {
  if (memory) return memory;
  try {
    if (existsSync(DATA_FILE)) {
      memory = migrateState(JSON.parse(readFileSync(DATA_FILE, "utf8")) as StoreState);
      persist(memory);
      return memory;
    }
  } catch {
    memory = null;
  }
  memory = createSeedState();
  persist(memory);
  return memory;
}

function persist(state: StoreState) {
  writeQueue = writeQueue.then(() => {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
  });
}

export function mutateState<T>(fn: (state: StoreState) => T): T {
  const state = loadState();
  const result = fn(state);
  persist(state);
  return result;
}

export function resetState(): StoreState {
  memory = createSeedState();
  persist(memory);
  return memory;
}

export function snapshot(): StoreState {
  return clone(loadState());
}

function migrateState(state: StoreState): StoreState {
  if (!state.attendance) state.attendance = [];
  for (const template of state.templates) {
    template.layout = normalizeLayout(template.layout);
    migrateTemplateHtml(template);
    if (!template.termStructure) {
      const year = state.years.find((y) => y.id === template.academicYearId);
      template.termStructure = parseTermStructure(year?.termStructure ?? "trimester");
    }
  }
  for (const item of state.items) {
    if (item.itemType === "comment" && !item.maxChars) {
      item.maxChars = 500;
    }
    if (item.itemType === "mark" && !item.gradeScaleId) {
      const section = state.sections.find((s) => s.id === item.sectionId);
      const template = state.templates.find((t) => t.id === section?.templateId);
      item.gradeScaleId = template?.gradeScaleId;
    }
    item.printCode = normalizePrintCode(item.printCode);
  }
  ensureKindergarten(state);
  ensureKindergartenScales(state);
  ensureSpecialistGrading(state);
  return state;
}

function migrateTemplateHtml(template: ReportCardTemplate) {
  const legacy = template as ReportCardTemplate & { htmlEn?: string; htmlEs?: string };
  if (template.html == null) {
    template.html = legacy.htmlEn ?? "";
  }
  if (!template.locale) {
    template.locale = parseLocale("en");
  }
}
