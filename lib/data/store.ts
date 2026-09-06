import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { normalizeLayout } from "@/lib/data/layout";
import { createSeedState } from "@/lib/data/seed";
import { ensureKindergarten } from "@/lib/documents/kindergarten";
import type { StoreState } from "@/lib/types";

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
    if (template.htmlEn == null) template.htmlEn = "";
    if (template.htmlEs == null) template.htmlEs = "";
  }
  for (const item of state.items) {
    if (item.itemType === "comment" && !item.maxChars) {
      item.maxChars = 500;
    }
  }
  ensureKindergarten(state);
  return state;
}
