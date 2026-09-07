"use client";

import { useEffect, useId, useState, type KeyboardEvent } from "react";
import {
  markCodeForId,
  markInputHint,
  resolveTypedMark,
} from "@/lib/data/mark-entry";
import type { GradeScaleMark } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MarkInput({
  marks,
  markId,
  disabled,
  disabledReason,
  compact = false,
  gridRow,
  gridCol,
  onKeyDown,
  onCommit,
}: {
  marks: GradeScaleMark[];
  markId: string | null | undefined;
  disabled?: boolean;
  disabledReason?: string;
  compact?: boolean;
  gridRow?: number;
  gridCol?: number;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onCommit: (markId: string | null) => void;
}) {
  const hintId = useId();
  const saved = markCodeForId(marks, markId);
  const [draft, setDraft] = useState(saved);
  const hint = markInputHint(marks);
  const longest = Math.max(1, ...marks.map((mark) => mark.code.length));

  useEffect(() => {
    setDraft(saved);
  }, [saved]);

  function commitFrom(value: string) {
    const resolved = resolveTypedMark(value, marks);
    if (resolved.status === "match") {
      setDraft(markCodeForId(marks, resolved.markId));
      onCommit(resolved.markId);
      return true;
    }
    if (resolved.status === "empty") {
      setDraft("");
      onCommit(null);
      return true;
    }
    return false;
  }

  return (
    <span className={cn("group relative block", compact ? "w-full" : "w-full")}>
      <input
        type="text"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        readOnly={disabled}
        aria-readonly={disabled || undefined}
        value={draft}
        maxLength={longest}
        aria-label="Mark"
        aria-describedby={disabled ? undefined : hintId}
        title={disabled ? disabledReason : hint}
        placeholder="–"
        data-grid-row={gridRow}
        data-grid-col={gridCol}
        onKeyDown={onKeyDown}
        onFocus={(event) => {
          event.currentTarget.select();
        }}
        onChange={(event) => {
          if (disabled) return;
          const next = event.target.value;
          const resolved = resolveTypedMark(next, marks);
          if (resolved.status === "invalid") return;
          setDraft(next);
          if (resolved.status === "match" || resolved.status === "empty") {
            commitFrom(next);
          }
        }}
        onBlur={() => {
          if (disabled) {
            setDraft(saved);
            return;
          }
          if (!commitFrom(draft)) setDraft(saved);
        }}
        className={cn(
          "h-8 w-full rounded-md border-0 bg-transparent px-1 text-center font-mono text-sm outline-none placeholder:text-muted-foreground focus:bg-background focus:ring-1 focus:ring-ring",
          disabled && "cursor-not-allowed opacity-80",
          !compact && "min-w-14",
          compact &&
            "h-9 rounded-lg border border-input bg-background px-2 text-left focus:ring-0 focus-visible:border-ring",
        )}
      />
      {disabled ? null : (
        <span
          id={hintId}
          role="tooltip"
          className={cn(
            compact
              ? "mt-1 block text-xs text-muted-foreground"
              : "pointer-events-none absolute bottom-full left-1/2 z-0 mb-1.5 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-[11px] whitespace-nowrap text-background opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
          )}
        >
          {hint}
        </span>
      )}
    </span>
  );
}
