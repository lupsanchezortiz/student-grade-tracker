import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { createSeedState } from "@/lib/data/seed";
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
      memory = JSON.parse(readFileSync(DATA_FILE, "utf8")) as StoreState;
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
