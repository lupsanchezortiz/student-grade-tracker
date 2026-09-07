import type { GradeScaleMark } from "@/lib/types";

const BLANK_CODES = new Set(["", "-", "–", "—"]);

export function markInputHint(marks: Pick<GradeScaleMark, "code">[]) {
  return `– ${marks.map((mark) => mark.code).join(" ")}`;
}

export function markCodeForId(
  marks: Pick<GradeScaleMark, "id" | "code">[],
  markId: string | null | undefined,
) {
  if (!markId) return "";
  return marks.find((mark) => mark.id === markId)?.code ?? "";
}

export function resolveTypedMark(
  raw: string,
  marks: Pick<GradeScaleMark, "id" | "code">[],
):
  | { status: "empty" }
  | { status: "match"; markId: string }
  | { status: "prefix" }
  | { status: "invalid" } {
  const typed = raw.trim();
  if (BLANK_CODES.has(typed)) return { status: "empty" };

  const lower = typed.toLowerCase();
  const exact = marks.filter((mark) => mark.code.toLowerCase() === lower);
  const hasLonger = marks.some(
    (mark) => mark.code.toLowerCase().startsWith(lower) && mark.code.length > typed.length,
  );
  if (exact.length === 1 && !hasLonger) {
    return { status: "match", markId: exact[0].id };
  }
  if (
    exact.length > 0 ||
    marks.some((mark) => mark.code.toLowerCase().startsWith(lower))
  ) {
    return { status: "prefix" };
  }
  return { status: "invalid" };
}
