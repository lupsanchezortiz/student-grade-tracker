"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { saveGradeAction } from "@/lib/actions/mutations";
import { isSpecialistSection } from "@/lib/data/access";
import { itemTitle, marksForItem, sectionTitle } from "@/lib/data/template-doc";
import { studentName } from "@/lib/format";
import type { AttendanceRecord, GradebookPayload, Locale, TemplateItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CsvImportDialog } from "@/components/csv-import-dialog";
import { handleGradebookGridKeyDown } from "@/components/gradebook/grid-keyboard";
import { MarkInput } from "@/components/gradebook/mark-input";
import { cn } from "@/lib/utils";

export const ATTENDANCE_TAB_ID = "attendance";

type TemplateSection = GradebookPayload["course"]["template"]["sections"][number];

type CellKey = string;
type ItemWithSection = TemplateItem & { section: TemplateSection };

function key(enrollmentId: string, itemId: string) {
  return `${enrollmentId}:${itemId}`;
}

function marksFromGrades(grades: GradebookPayload["grades"]) {
  const next: Record<CellKey, string> = {};
  for (const grade of grades) {
    if (grade.markId) next[key(grade.enrollmentId, grade.templateItemId)] = grade.markId;
  }
  return next;
}

function commentsFromGrades(grades: GradebookPayload["grades"]) {
  const next: Record<CellKey, string> = {};
  for (const grade of grades) {
    if (grade.comment) next[key(grade.enrollmentId, grade.templateItemId)] = grade.comment;
  }
  return next;
}

function resolveSectionId(
  sections: TemplateSection[],
  requested: string | undefined,
  editable: Set<string>,
) {
  if (requested === ATTENDANCE_TAB_ID) return ATTENDANCE_TAB_ID;
  if (requested && sections.some((section) => section.id === requested)) {
    return requested;
  }
  const firstEditable = sections.find((section) =>
    section.items.some((item) => editable.has(item.id)),
  );
  return firstEditable?.id ?? sections[0]?.id ?? ATTENDANCE_TAB_ID;
}

function syncSectionUrl(termId: string, sectionId: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("term", termId);
  url.searchParams.set("section", sectionId);
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

const stickyIdClass =
  "sticky left-0 z-30 box-border w-28 min-w-28 max-w-28 overflow-hidden border-b border-r border-border px-2.5 py-1.5 text-left align-middle whitespace-nowrap";
const stickyNameClass =
  "sticky left-28 z-30 box-border w-52 min-w-52 max-w-52 overflow-hidden border-b border-r border-border px-3 py-1.5 text-left align-middle whitespace-nowrap shadow-[2px_0_6px_-2px_rgba(15,23,42,0.18)]";
const headerRowClass =
  "h-12 max-h-12";
const headerItemClass =
  "h-12 max-h-12 border-b border-l border-border px-1.5 py-1 text-center text-xs font-medium leading-tight";

export function GradebookGrid({
  book,
  initialSectionId,
}: {
  book: GradebookPayload;
  initialSectionId?: string;
}) {
  const { course, term, terms, canPrint, grades, attendance, editableItemIds, canImportAttendance } =
    book;
  const editable = useMemo(() => new Set(editableItemIds ?? []), [editableItemIds]);
  const canEditAny = editable.size > 0;
  const specialistLocked = course.template.sections.some(
    (section) => isSpecialistSection(section) && section.items.some((item) => !editable.has(item.id)),
  );
  const homeroomLocked = course.template.sections.some(
    (section) =>
      !isSpecialistSection(section) && section.items.some((item) => !editable.has(item.id)),
  );
  const [marks, setMarks] = useState<Record<CellKey, string>>(() => marksFromGrades(grades));
  const [comments, setComments] = useState<Record<CellKey, string>>(() =>
    commentsFromGrades(grades),
  );
  const [pending, setPending] = useState<Record<CellKey, "saving" | "saved" | "error">>({});

  useEffect(() => {
    setMarks(marksFromGrades(grades));
    setComments(commentsFromGrades(grades));
    setPending({});
  }, [term.id]);
  const [openStudent, setOpenStudent] = useState<string | null>(
    course.enrollments[0]?.studentId ?? null,
  );
  const [sectionId, setSectionId] = useState(() =>
    resolveSectionId(course.template.sections, initialSectionId, editable),
  );

  const isAttendance = sectionId === ATTENDANCE_TAB_ID;
  const activeSection = isAttendance
    ? undefined
    : (course.template.sections.find((section) => section.id === sectionId) ??
      course.template.sections[0]);
  const items = useMemo<ItemWithSection[]>(() => {
    if (!activeSection) return [];
    return activeSection.items.map((item) => ({ ...item, section: activeSection }));
  }, [activeSection]);
  const attendanceByEnrollment = useMemo(() => {
    const next = new Map<string, AttendanceRecord>();
    for (const row of attendance) next.set(row.enrollmentId, row);
    return next;
  }, [attendance]);

  const visibleMarks = useMemo(() => {
    const seen = new Set<string>();
    const next = [];
    for (const item of items) {
      for (const mark of marksForItem(course.template, item)) {
        if (seen.has(mark.id)) continue;
        seen.add(mark.id);
        next.push(mark);
      }
    }
    return next;
  }, [course.template, items]);

  async function persist(
    enrollmentId: string,
    itemId: string,
    markId: string | null,
    comment: string,
  ) {
    const k = key(enrollmentId, itemId);
    if (!editable.has(itemId)) return;
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

  function onMarkChange(enrollmentId: string, itemId: string, markId: string | null) {
    const k = key(enrollmentId, itemId);
    setMarks((m) => {
      const next = { ...m };
      if (markId) next[k] = markId;
      else delete next[k];
      return next;
    });
    void persist(enrollmentId, itemId, markId, comments[k] ?? "");
  }

  function onCommentBlur(enrollmentId: string, itemId: string, comment: string) {
    const k = key(enrollmentId, itemId);
    setComments((c) => ({ ...c, [k]: comment }));
    void persist(enrollmentId, itemId, marks[k] ?? null, comment);
  }

  function onSectionChange(next: string | null) {
    if (!next) return;
    setSectionId(next);
    syncSectionUrl(term.id, next);
  }

  const gradebookHref = (termId: string, nextSection = sectionId) => {
    const query = new URLSearchParams({ term: termId });
    if (nextSection) query.set("section", nextSection);
    return `/sites/${course.siteId}/courses/${course.id}/gradebook?${query}`;
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
          {terms.map((t) => (
            <Link
              key={t.id}
              href={gradebookHref(t.id)}
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
          {canImportAttendance ? (
            <CsvImportDialog
              kind="attendance"
              siteId={course.siteId}
              triggerLabel="Import attendance"
            />
          ) : null}
          <p className="text-xs text-muted-foreground">
            {isAttendance
              ? canImportAttendance
                ? "Absences and tardies come from a CSV. Import updates this tab and the printed card."
                : "A site administrator loads absences and tardies from CSV. This tab is view only."
              : grades.length === 0
                ? `${term.nameEn} starts blank. Marks you enter here stay in this trimester.`
              : canEditAny
                ? specialistLocked
                  ? "Special subject marks are entered by specialist teachers. Tab moves across, Enter moves down, arrows move between cells."
                  : homeroomLocked
                    ? "Homeroom columns are view only. Tab, Enter, and arrows still move between cells."
                    : "Tab moves across. Enter moves down. Arrow keys move between cells."
                : "View only. Tab, Enter, and arrows move between cells."}
          </p>
        </div>
      </div>

      {!isAttendance && visibleMarks.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {visibleMarks.map((mark) => (
            <span key={mark.id}>
              <span className="font-mono font-semibold text-foreground">{mark.code}</span>{" "}
              {mark.labelEn}
            </span>
          ))}
        </div>
      ) : null}

      {course.enrollments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
          No students enrolled. A site administrator needs to add them to this course.
        </p>
      ) : (
        <>
          <div className="hidden md:block">
            <div className="flex items-end">
              <div className="w-80 shrink-0" aria-hidden />
              <SectionFolderTabs
                sections={course.template.sections}
                sectionId={sectionId}
                locale={course.template.locale}
                attendanceLoaded={attendance.length}
                onChange={onSectionChange}
              />
            </div>
            {!isAttendance && items.length === 0 ? (
              <p className="rounded-b-xl rounded-tl-xl rounded-tr-xl border border-border bg-card px-4 py-8 text-sm text-muted-foreground">
                This section has no line items yet.
              </p>
            ) : (
            <div className="w-fit max-w-full overflow-auto rounded-b-xl rounded-tl-xl rounded-tr-xl border border-border bg-card">
            <table
              className="w-max border-separate border-spacing-0 text-sm"
              data-gradebook-grid=""
              data-grid-rows={course.enrollments.length}
              data-grid-cols={isAttendance ? 2 : items.length}
            >
              <colgroup>
                <col className="w-28" />
                <col className="w-52" />
                {isAttendance ? (
                  <>
                    <col className="w-24" />
                    <col className="w-24" />
                  </>
                ) : (
                  items.map((item) => (
                    <col
                      key={item.id}
                      className={item.itemType === "comment" ? "w-72" : "w-36"}
                    />
                  ))
                )}
              </colgroup>
              <thead>
                <tr className="bg-muted/80">
                  <th className={cn(stickyIdClass, headerRowClass, "bg-muted font-medium")}>
                    Student ID
                  </th>
                  <th className={cn(stickyNameClass, headerRowClass, "bg-muted font-medium")}>
                    Student
                  </th>
                  {isAttendance ? (
                    <>
                      <th className={cn(headerItemClass, "box-border w-24 min-w-24 max-w-24")}>
                        Absences
                      </th>
                      <th className={cn(headerItemClass, "box-border w-24 min-w-24 max-w-24")}>
                        Tardies
                      </th>
                    </>
                  ) : (
                    items.map((item) => {
                      const title = itemTitle(item, course.template.locale);
                      return (
                        <th
                          key={item.id}
                          title={title}
                          className={cn(
                            headerItemClass,
                            item.itemType === "comment"
                              ? "w-72 min-w-72"
                              : "box-border w-36 min-w-36 max-w-36",
                          )}
                        >
                          <span className="line-clamp-2">{title}</span>
                        </th>
                      );
                    })
                  )}
                </tr>
              </thead>
              <tbody>
                {course.enrollments.map((enrollment, rowIndex) => {
                  const stripe = rowIndex % 2 ? "bg-muted" : "bg-card";
                  const row = attendanceByEnrollment.get(enrollment.id);
                  return (
                    <tr key={enrollment.id} className={rowIndex % 2 ? "bg-muted/25" : "bg-card"}>
                      <th
                        className={cn(
                          stickyIdClass,
                          "z-20 py-1.5 font-mono text-xs font-medium text-muted-foreground",
                          stripe,
                        )}
                      >
                        {enrollment.student.studentNumber}
                      </th>
                      <th className={cn(stickyNameClass, "z-20 py-1.5 font-medium", stripe)}>
                        {studentName(enrollment.student)}
                      </th>
                      {isAttendance ? (
                        <>
                          <AttendanceCell value={row?.absences} />
                          <AttendanceCell value={row?.tardies} />
                        </>
                      ) : (
                        items.map((item, colIndex) => {
                          const k = key(enrollment.id, item.id);
                          const status = pending[k];
                          const itemEditable = editable.has(item.id);
                          const lockedTitle = isSpecialistSection(item.section)
                            ? "Entered by a specialist teacher"
                            : "Entered by the homeroom teacher";
                          return (
                            <td
                              key={item.id}
                              className={cn(
                                "border-b border-l border-border p-1",
                                item.itemType === "comment"
                                  ? "min-w-72"
                                  : "box-border w-36 min-w-36 max-w-36",
                                !itemEditable && "bg-muted/40",
                                status === "saving" && "bg-amber-50",
                                status === "error" && "bg-red-50",
                              )}
                            >
                              {item.itemType === "comment" ? (
                                <textarea
                                  readOnly={!itemEditable}
                                  aria-readonly={!itemEditable || undefined}
                                  defaultValue={comments[k] ?? ""}
                                  maxLength={item.maxChars ?? undefined}
                                  data-grid-row={rowIndex}
                                  data-grid-col={colIndex}
                                  onKeyDown={(event) =>
                                    handleGradebookGridKeyDown(event, "comment")
                                  }
                                  onBlur={(e) => {
                                    if (!itemEditable) return;
                                    onCommentBlur(enrollment.id, item.id, e.target.value);
                                  }}
                                  title={itemEditable ? undefined : lockedTitle}
                                  className={cn(
                                    "min-h-10 w-full min-w-40 resize-none rounded-md border-0 bg-transparent px-1.5 py-1 text-xs outline-none focus:bg-background focus:ring-1 focus:ring-ring",
                                    !itemEditable && "cursor-not-allowed opacity-80",
                                  )}
                                  placeholder={item.maxChars ? `Note (${item.maxChars} max)` : "Note"}
                                />
                              ) : (
                                <MarkInput
                                  marks={marksForItem(course.template, item)}
                                  markId={marks[k] ?? null}
                                  disabled={!itemEditable}
                                  disabledReason={lockedTitle}
                                  gridRow={rowIndex}
                                  gridCol={colIndex}
                                  onKeyDown={(event) =>
                                    handleGradebookGridKeyDown(event, "mark")
                                  }
                                  onCommit={(markId) => onMarkChange(enrollment.id, item.id, markId)}
                                />
                              )}
                            </td>
                          );
                        })
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            )}
          </div>

          <div className="md:hidden">
            <SectionFolderTabs
              sections={course.template.sections}
              sectionId={sectionId}
              locale={course.template.locale}
              attendanceLoaded={attendance.length}
              onChange={onSectionChange}
              className="mb-3"
            />
            <div className="mb-3 flex gap-2 overflow-x-auto">
              {course.enrollments.map((enrollment) => (
                <button
                  key={enrollment.studentId}
                  type="button"
                  onClick={() => setOpenStudent(enrollment.studentId)}
                  title={enrollment.student.studentNumber}
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
                  <div>
                    <h3 className="font-heading text-lg">{studentName(enrollment.student)}</h3>
                    <p className="font-mono text-xs text-muted-foreground">
                      Student ID {enrollment.student.studentNumber}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3">
                    {isAttendance ? (
                      <>
                        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          Attendance
                          <span className="ml-2 font-normal tracking-normal normal-case">
                            · site admin CSV
                          </span>
                        </p>
                        <dl className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <dt className="text-muted-foreground">Absences</dt>
                            <dd className="font-mono text-lg tabular-nums">
                              {attendanceByEnrollment.get(enrollment.id)?.absences ?? "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Tardies</dt>
                            <dd className="font-mono text-lg tabular-nums">
                              {attendanceByEnrollment.get(enrollment.id)?.tardies ?? "—"}
                            </dd>
                          </div>
                        </dl>
                      </>
                    ) : items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">This section has no line items yet.</p>
                    ) : (
                      <>
                    <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {activeSection
                        ? sectionTitle(activeSection, course.template.locale)
                        : "Section"}
                      {activeSection && isSpecialistSection(activeSection) ? (
                        <span className="ml-2 font-normal tracking-normal normal-case">
                          · specialist enters
                        </span>
                      ) : null}
                    </p>
                    <ul className="space-y-2">
                      {items.map((item) => {
                        const k = key(enrollment.id, item.id);
                        const itemEditable = editable.has(item.id);
                        const lockedTitle =
                          activeSection && isSpecialistSection(activeSection)
                            ? "Entered by a specialist teacher"
                            : "Entered by the homeroom teacher";
                        return (
                          <li key={item.id} className="flex flex-col gap-1">
                            <span className="text-sm">{itemTitle(item, course.template.locale)}</span>
                            {item.itemType === "comment" ? (
                              <textarea
                                disabled={!itemEditable}
                                defaultValue={comments[k] ?? ""}
                                maxLength={item.maxChars ?? undefined}
                                onBlur={(e) =>
                                  onCommentBlur(enrollment.id, item.id, e.target.value)
                                }
                                title={itemEditable ? undefined : lockedTitle}
                                className="min-h-16 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm disabled:cursor-not-allowed disabled:bg-muted/50"
                                placeholder={item.maxChars ? `${item.maxChars} characters max` : undefined}
                              />
                            ) : (
                              <MarkInput
                                marks={marksForItem(course.template, item)}
                                markId={marks[k] ?? null}
                                disabled={!itemEditable}
                                disabledReason={lockedTitle}
                                compact
                                onCommit={(markId) => onMarkChange(enrollment.id, item.id, markId)}
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                      </>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

function folderTabClass(active: boolean) {
  return cn(
    "max-w-48 rounded-t-lg border px-3 text-left transition-colors",
    active
      ? "-mb-px border-border border-b-transparent bg-muted pb-2 pt-1.5 text-foreground"
      : "border-transparent bg-muted/70 pb-1.5 pt-1 text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

function AttendanceCell({ value }: { value: number | undefined }) {
  return (
    <td className="box-border w-24 min-w-24 max-w-24 border-b border-l border-border bg-muted/40 px-2 py-2 text-center">
      <span className="font-mono text-sm tabular-nums">
        {value == null ? "—" : value}
      </span>
    </td>
  );
}

function SectionFolderTabs({
  sections,
  sectionId,
  locale,
  attendanceLoaded,
  onChange,
  className,
}: {
  sections: TemplateSection[];
  sectionId: string;
  locale: Locale;
  attendanceLoaded: number;
  onChange: (sectionId: string | null) => void;
  className?: string;
}) {
  const attendanceActive = sectionId === ATTENDANCE_TAB_ID;
  return (
    <div
      role="tablist"
      aria-label="Report card section"
      className={cn("flex min-w-0 flex-1 flex-wrap items-end gap-1", className)}
    >
      {sections.map((section) => {
        const active = section.id === sectionId;
        return (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(section.id)}
            className={folderTabClass(active)}
          >
            <span className="block text-xs font-semibold leading-tight">
              {sectionTitle(section, locale)}
            </span>
            <span className="mt-0.5 block text-[10px] font-normal leading-tight">
              {section.items.length} {section.items.length === 1 ? "item" : "items"}
              {isSpecialistSection(section) ? " · specialist" : ""}
            </span>
          </button>
        );
      })}
      <button
        type="button"
        role="tab"
        aria-selected={attendanceActive}
        onClick={() => onChange(ATTENDANCE_TAB_ID)}
        className={folderTabClass(attendanceActive)}
      >
        <span className="block text-xs font-semibold leading-tight">Attendance</span>
        <span className="mt-0.5 block text-[10px] font-normal leading-tight">
          {attendanceLoaded === 0
            ? "CSV import"
            : `${attendanceLoaded} ${attendanceLoaded === 1 ? "record" : "records"}`}
        </span>
      </button>
    </div>
  );
}
