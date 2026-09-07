import type { KeyboardEvent as ReactKeyboardEvent } from "react";

const GRID_SELECTOR = "[data-grid-row][data-grid-col]";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function caretAtStart(target: HTMLInputElement | HTMLTextAreaElement) {
  const start = target.selectionStart ?? 0;
  const end = target.selectionEnd ?? 0;
  return start === 0 && end === 0;
}

function caretAtEnd(target: HTMLInputElement | HTMLTextAreaElement) {
  const start = target.selectionStart ?? 0;
  const end = target.selectionEnd ?? 0;
  return start === target.value.length && end === target.value.length;
}

export function focusGridCell(root: HTMLElement, row: number, col: number) {
  const next = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `${GRID_SELECTOR}[data-grid-row="${row}"][data-grid-col="${col}"]`,
  );
  if (!next) return;
  next.focus();
  next.scrollIntoView({ block: "nearest", inline: "nearest" });
  if (next instanceof HTMLInputElement) next.select();
}

export function handleGradebookGridKeyDown(
  event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  kind: "mark" | "comment",
) {
  if (event.nativeEvent.isComposing) return;
  const target = event.currentTarget;
  const root = target.closest<HTMLElement>("[data-gradebook-grid]");
  if (!root) return;

  const row = Number(target.dataset.gridRow);
  const col = Number(target.dataset.gridCol);
  const rows = Number(root.dataset.gridRows);
  const cols = Number(root.dataset.gridCols);
  if (!Number.isFinite(row) || !Number.isFinite(col) || rows < 1 || cols < 1) return;

  const move = (dRow: number, dCol: number, wrap: boolean) => {
    event.preventDefault();
    let nextRow = row + dRow;
    let nextCol = col + dCol;
    if (wrap && dRow === 0) {
      if (nextCol >= cols) {
        nextCol = 0;
        nextRow += 1;
      } else if (nextCol < 0) {
        nextCol = cols - 1;
        nextRow -= 1;
      }
    }
    nextRow = clamp(nextRow, 0, rows - 1);
    nextCol = clamp(nextCol, 0, cols - 1);
    if (nextRow === row && nextCol === col) return;
    focusGridCell(root, nextRow, nextCol);
  };

  if (event.key === "Tab") {
    move(0, event.shiftKey ? -1 : 1, true);
    return;
  }
  if (event.key === "Enter") {
    if (kind === "comment" && event.shiftKey) return;
    move(event.shiftKey ? -1 : 1, 0, false);
    return;
  }
  if (event.key === "ArrowUp" && (kind === "mark" || caretAtStart(target))) {
    move(-1, 0, false);
    return;
  }
  if (event.key === "ArrowDown" && (kind === "mark" || caretAtEnd(target))) {
    move(1, 0, false);
    return;
  }
  if (event.key === "ArrowLeft" && (kind === "mark" || caretAtStart(target))) {
    move(0, -1, false);
    return;
  }
  if (event.key === "ArrowRight" && (kind === "mark" || caretAtEnd(target))) {
    move(0, 1, false);
  }
}
