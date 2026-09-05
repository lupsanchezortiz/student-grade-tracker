"use client";

import { useState } from "react";
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
        toast.success(
          `Imported ${next.created} new and updated ${next.updated}.`,
        );
        setOpen(false);
        setText("");
        setResult(null);
      } else {
        toast.message(
          `${next.created} created, ${next.updated} updated, ${next.skipped} skipped.`,
        );
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
