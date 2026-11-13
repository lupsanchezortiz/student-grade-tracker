"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { importCsvAction } from "@/lib/actions/mutations";
import { parseCsv } from "@/lib/csv/parse";
import { SAMPLES, type ImportKind } from "@/lib/csv/samples";
import type { ImportResult } from "@/lib/csv/parse";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TITLES: Record<ImportKind, string> = {
  students: "Import students",
  staff: "Import staff",
  courses: "Import courses",
  enrollments: "Import enrollments",
  grades: "Import grades",
  attendance: "Import attendance",
  template_items: "Import line items",
};

export function CsvImportDialog({
  kind,
  siteId,
  templateId,
  triggerLabel = "Import CSV",
}: {
  kind: ImportKind;
  siteId?: string;
  templateId?: string;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const preview = text ? parseCsv(text) : { headers: [], rows: [] };

  function downloadSample() {
    const blob = new Blob([SAMPLES[kind]], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${kind}-sample.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setResult(null);
    setText(await file.text());
  }

  async function commit() {
    setBusy(true);
    try {
      const next = await importCsvAction({ kind, csv: text, siteId, templateId });
      setResult(next);
      if (next.errors.length === 0) {
        let message = `Imported ${next.created} new and updated ${next.updated}.`;
        if (kind === "staff" && (next.authInvited || next.authLinked || next.authSkipped)) {
          const authDetails: string[] = [];
          if (next.authInvited) authDetails.push(`${next.authInvited} invited`);
          if (next.authLinked) authDetails.push(`${next.authLinked} linked`);
          if (next.authSkipped) authDetails.push(`${next.authSkipped} login skipped`);
          message += ` Login accounts: ${authDetails.join(", ")}.`;
        }
        toast.success(message);
        setOpen(false);
        setText("");
        setResult(null);
        router.refresh();
      } else {
        let message = `${next.created} created, ${next.updated} updated, ${next.skipped} skipped.`;
        if (kind === "staff" && (next.authInvited || next.authLinked || next.authSkipped)) {
          const authDetails: string[] = [];
          if (next.authInvited) authDetails.push(`${next.authInvited} invited`);
          if (next.authLinked) authDetails.push(`${next.authLinked} linked`);
          if (next.authSkipped) authDetails.push(`${next.authSkipped} login skipped`);
          message += ` Login accounts: ${authDetails.join(", ")}.`;
        }
        toast.message(message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{TITLES[kind]}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Upload a CSV, review the rows, then import. Matching records are updated instead of duplicated.
        </p>
        {kind === "template_items" ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">print_code</span> is the line number
            (01, 02, 08), not the HTML tag. Tags expand from the school’s terms:
            trimesters use <span className="font-mono">{"{{101}} {{201}} {{301}}"}</span>,
            semesters two terms, quarters four (
            <span className="font-mono">{"{{401}}"}</span>). Match existing items by line
            number, or by section + title. Type is <span className="font-mono">m</span> or{" "}
            <span className="font-mono">c</span>. This template’s language picks{" "}
            <span className="font-mono">list_item_eng</span> or{" "}
            <span className="font-mono">list_item_span</span>.{" "}
            <span className="font-medium text-foreground">grade_scale</span> applies to that
            line item, not the whole template.
          </p>
        ) : null}
        {kind === "enrollments" ? (
          <p className="text-sm text-muted-foreground">
            Key: school + year + grade + course name + student number. Each row enrolls one student
            in one course. Students and courses must already exist — import them first. Duplicate
            enrollments are skipped.
          </p>
        ) : null}
        {kind === "grades" ? (
          <p className="text-sm text-muted-foreground">
            Key: school + year + course name + student number + term + template item. Each row is
            one grade or comment for one student in one course. Identify items by{" "}
            <span className="font-medium text-foreground">template_item</span> (title) or{" "}
            <span className="font-medium text-foreground">print_code</span>. For mark items, provide{" "}
            <span className="font-medium text-foreground">mark_code</span> (1, 2, 3, 4). For
            comment items, use <span className="font-medium text-foreground">comment</span>.
            Students, courses, and enrollments must exist. Re-importing updates existing grades.
          </p>
        ) : null}
        {kind === "attendance" ? (
          <p className="text-sm text-muted-foreground">
            Key: school + student number + year + term.{" "}
            <span className="font-medium text-foreground">term</span> can be{" "}
            <span className="font-mono">1</span>, <span className="font-mono">2</span>,{" "}
            <span className="font-mono">3</span>, or the period name (Trimester 2).
            Absences and tardies are whole numbers. An optional{" "}
            <span className="font-mono">course</span> column limits the row to one
            class; otherwise every enrollment for that student and year is updated.
            Teachers see the numbers on the gradebook Attendance tab; they print as{" "}
            <span className="font-mono">{"{{1A}}"}</span> /{" "}
            <span className="font-mono">{"{{1T}}"}</span>.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={downloadSample}>
            Download sample
          </Button>
          <label className="inline-flex h-7 cursor-pointer items-center rounded-lg border border-border px-2.5 text-sm">
            Choose file
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </label>
        </div>
        {preview.rows.length > 0 ? (
          <div className="max-h-48 overflow-auto rounded-lg border border-border text-xs">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  {preview.headers.map((h) => (
                    <th key={h} className="px-2 py-1 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 8).map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    {preview.headers.map((h) => (
                      <td key={h} className="px-2 py-1">
                        {row[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.rows.length > 8 ? (
              <p className="px-2 py-1 text-muted-foreground">
                Showing 8 of {preview.rows.length} rows
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No file selected yet.</p>
        )}
        {result?.errors.length ? (
          <ul className="max-h-32 overflow-auto text-sm text-destructive">
            {result.errors.map((err, i) => (
              <li key={i}>
                Row {err.row}: {err.message}
              </li>
            ))}
          </ul>
        ) : null}
        <Button type="button" disabled={!text || busy} onClick={() => void commit()}>
          {busy ? "Importing…" : `Import ${preview.rows.length || ""} rows`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
