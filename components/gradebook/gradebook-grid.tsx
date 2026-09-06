"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { saveAttendanceAction, saveGradeAction } from "@/lib/actions/mutations";
import { itemTitle, sectionTitle } from "@/lib/data/template-doc";
import { studentName } from "@/lib/format";
import type { GradebookPayload } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CellKey = string;

function key(enrollmentId: string, itemId: string) {
  return `${enrollmentId}:${itemId}`;
}

export function GradebookGrid({ book }: { book: GradebookPayload }) {
  const { course, term, terms, canEdit, canPrint, grades, attendance } = book;
  const [marks, setMarks] = useState<Record<CellKey, string>>(() => {
    const next: Record<CellKey, string> = {};
    for (const g of grades) {
      if (g.markId) next[key(g.enrollmentId, g.templateItemId)] = g.markId;
    }
    return next;
  });
  const [comments, setComments] = useState<Record<CellKey, string>>(() => {
    const next: Record<CellKey, string> = {};
    for (const g of grades) {
      if (g.comment) next[key(g.enrollmentId, g.templateItemId)] = g.comment;
    }
    return next;
  });
  const [pending, setPending] = useState<Record<CellKey, "saving" | "saved" | "error">>({});
  const [openStudent, setOpenStudent] = useState<string | null>(
    course.enrollments[0]?.studentId ?? null,
  );
  const [attendanceDraft, setAttendanceDraft] = useState<
    Record<string, { absences: string; tardies: string }>
  >(() => {
    const next: Record<string, { absences: string; tardies: string }> = {};
    for (const row of attendance) {
      next[row.enrollmentId] = {
        absences: String(row.absences),
        tardies: String(row.tardies),
      };
    }
    return next;
  });

  const items = useMemo(
    () => course.template.sections.flatMap((s) => s.items.map((item) => ({ ...item, section: s }))),
    [course.template.sections],
  );

  async function persist(
    enrollmentId: string,
    itemId: string,
    markId: string | null,
    comment: string,
  ) {
    const k = key(enrollmentId, itemId);
    setPending((p) => ({ ...p, [k]: "saving" }));
    try {
      await saveGradeAction({
        enrollmentId,
        termId: term.id,
        templateItemId: itemId,
        markId,
        comment,
      });
      setPending((p) => ({ ...p, [k]: "saved" }));
    } catch (error) {
      setPending((p) => ({ ...p, [k]: "error" }));
      toast.error(error instanceof Error ? error.message : "Could not save mark.");
    }
  }

  function onMarkChange(enrollmentId: string, itemId: string, markId: string) {
    const k = key(enrollmentId, itemId);
    setMarks((m) => ({ ...m, [k]: markId }));
    void persist(enrollmentId, itemId, markId || null, comments[k] ?? "");
  }

  function onCommentBlur(enrollmentId: string, itemId: string, comment: string) {
    const k = key(enrollmentId, itemId);
    setComments((c) => ({ ...c, [k]: comment }));
    void persist(enrollmentId, itemId, marks[k] ?? null, comment);
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
          {terms.map((t) => (
            <Link
              key={t.id}
              href={`/sites/${course.siteId}/courses/${course.id}/gradebook?term=${t.id}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm",
                t.id === term.id ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {t.nameEn}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canPrint ? (
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/sites/${course.siteId}/courses/${course.id}/report-cards?term=${term.id}`} />}
            >
              Report cards
            </Button>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {canEdit ? "Changes save as you leave a cell." : "View only."}
          </p>
        </div>
      </div>

      {course.enrollments.length > 0 ? (
        <div className="mb-4 overflow-hidden rounded-xl border border-border bg-card">
          <p className="border-b border-border px-3 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Attendance this term
          </p>
          <ul className="divide-y divide-border text-sm">
            {course.enrollments.map((enrollment) => {
              const draft = attendanceDraft[enrollment.id] ?? { absences: "", tardies: "" };
              return (
                <li
                  key={enrollment.id}
                  className="flex flex-wrap items-center gap-3 px-3 py-2"
                >
                  <span className="min-w-40 font-medium">{studentName(enrollment.student)}</span>
                  <label className="flex items-center gap-1.5 text-xs">
                    Absences
                    <input
                      type="number"
                      min={0}
                      className="h-8 w-16 rounded-lg border border-input bg-background px-2"
                      value={draft.absences}
                      disabled={!canEdit}
                      onChange={(e) =>
                        setAttendanceDraft((prev) => ({
                          ...prev,
                          [enrollment.id]: { ...draft, absences: e.target.value },
                        }))
                      }
                      onBlur={() =>
                        void saveAttendanceAction({
                          enrollmentId: enrollment.id,
                          termId: term.id,
                          absences: Number(draft.absences) || 0,
                          tardies: Number(draft.tardies) || 0,
                        })
                      }
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs">
                    Tardies
                    <input
                      type="number"
                      min={0}
                      className="h-8 w-16 rounded-lg border border-input bg-background px-2"
                      value={draft.tardies}
                      disabled={!canEdit}
                      onChange={(e) =>
                        setAttendanceDraft((prev) => ({
                          ...prev,
                          [enrollment.id]: { ...draft, tardies: e.target.value },
                        }))
                      }
                      onBlur={() =>
                        void saveAttendanceAction({
                          enrollmentId: enrollment.id,
                          termId: term.id,
                          absences: Number(draft.absences) || 0,
                          tardies: Number(draft.tardies) || 0,
                        })
                      }
                    />
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {course.template.marks.map((mark) => (
          <span key={mark.id}>
            <span className="font-mono font-semibold text-foreground">{mark.code}</span>{" "}
            {mark.labelEn}
          </span>
        ))}
      </div>

      {course.enrollments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
          No students enrolled. A site administrator needs to add them to this course.
        </p>
      ) : (
        <>
          <div className="hidden overflow-auto rounded-xl border border-border bg-card md:block">
            <table className="min-w-max border-collapse text-sm">
              <thead>
                <tr className="bg-muted/80">
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-20 min-w-48 border-b border-r border-border bg-muted px-3 py-2 text-left font-medium"
                  >
                    Student
                  </th>
                  {course.template.sections.map((section) => (
                    <th
                      key={section.id}
                      colSpan={section.items.length}
                      className="border-b border-l border-border px-2 py-1.5 text-center text-xs font-semibold tracking-wide uppercase"
                    >
                      {sectionTitle(section, course.template.locale)}
                    </th>
                  ))}
                </tr>
                <tr className="bg-muted/50">
                  {course.template.sections.flatMap((section) =>
                    section.items.map((item) => (
                      <th
                        key={item.id}
                        className="max-w-28 border-b border-l border-border px-1.5 py-2 text-center text-xs font-medium leading-tight"
                      >
                        {itemTitle(item, course.template.locale)}
                      </th>
                    )),
                  )}
                </tr>
              </thead>
              <tbody>
                {course.enrollments.map((enrollment, rowIndex) => (
                  <tr key={enrollment.id} className={rowIndex % 2 ? "bg-muted/25" : "bg-card"}>
                    <th className="sticky left-0 z-10 border-r border-b border-border bg-inherit px-3 py-1.5 text-left font-medium">
                      {studentName(enrollment.student)}
                    </th>
                    {items.map((item) => {
                      const k = key(enrollment.id, item.id);
                      const status = pending[k];
                      return (
                        <td
                          key={item.id}
                          className={cn(
                            "border-b border-l border-border p-1",
                            status === "saving" && "bg-amber-50",
                            status === "error" && "bg-red-50",
                          )}
                        >
                          {item.itemType === "comment" ? (
                            <textarea
                              disabled={!canEdit}
                              defaultValue={comments[k] ?? ""}
                              maxLength={item.maxChars ?? undefined}
                              onBlur={(e) => onCommentBlur(enrollment.id, item.id, e.target.value)}
                              className="min-h-10 w-44 resize-none rounded-md border-0 bg-transparent px-1.5 py-1 text-xs outline-none focus:bg-background focus:ring-1 focus:ring-ring"
                              placeholder={item.maxChars ? `Note (${item.maxChars} max)` : "Note"}
                            />
                          ) : (
                            <select
                              disabled={!canEdit}
                              value={marks[k] ?? ""}
                              onChange={(e) => onMarkChange(enrollment.id, item.id, e.target.value)}
                              className="h-8 w-full min-w-16 rounded-md border-0 bg-transparent px-1 text-center font-mono text-sm outline-none focus:bg-background focus:ring-1 focus:ring-ring disabled:opacity-80"
                            >
                              <option value="">–</option>
                              {course.template.marks.map((mark) => (
                                <option key={mark.id} value={mark.id}>
                                  {mark.code}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden">
            <div className="mb-3 flex gap-2 overflow-x-auto">
              {course.enrollments.map((enrollment) => (
                <button
                  key={enrollment.studentId}
                  type="button"
                  onClick={() => setOpenStudent(enrollment.studentId)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-sm",
                    openStudent === enrollment.studentId
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card",
                  )}
                >
                  {enrollment.student.preferredName || enrollment.student.firstName}
                </button>
              ))}
            </div>
            {course.enrollments
              .filter((e) => e.studentId === openStudent)
              .map((enrollment) => (
                <div key={enrollment.id} className="space-y-4">
                  <h3 className="font-heading text-lg">{studentName(enrollment.student)}</h3>
                  {course.template.sections.map((section) => (
                    <div key={section.id} className="rounded-xl border border-border bg-card p-3">
                      <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {sectionTitle(section, course.template.locale)}
                      </p>
                      <ul className="space-y-2">
                        {section.items.map((item) => {
                          const k = key(enrollment.id, item.id);
                          return (
                            <li key={item.id} className="flex flex-col gap-1">
                              <span className="text-sm">{itemTitle(item, course.template.locale)}</span>
                              {item.itemType === "comment" ? (
                                <textarea
                                  disabled={!canEdit}
                                  defaultValue={comments[k] ?? ""}
                                  maxLength={item.maxChars ?? undefined}
                                  onBlur={(e) =>
                                    onCommentBlur(enrollment.id, item.id, e.target.value)
                                  }
                                  className="min-h-16 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                                  placeholder={item.maxChars ? `${item.maxChars} characters max` : undefined}
                                />
                              ) : (
                                <select
                                  disabled={!canEdit}
                                  value={marks[k] ?? ""}
                                  onChange={(e) =>
                                    onMarkChange(enrollment.id, item.id, e.target.value)
                                  }
                                  className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
                                >
                                  <option value="">Not marked</option>
                                  {course.template.marks.map((mark) => (
                                    <option key={mark.id} value={mark.id}>
                                      {mark.code} — {mark.labelEn}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
