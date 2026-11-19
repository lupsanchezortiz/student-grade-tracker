import type { Worksheet, Cell } from "exceljs";

export type CsvRow = Record<string, string>;

export type ImportError = { row: number; message: string };

export type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
  authInvited?: number;
  authLinked?: number;
  authSkipped?: number;
};

export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const delimiter = detectDelimiter(text);
  const rows = splitCsv(text, delimiter).filter((line) => line.some((cell) => cell.trim()));
  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const data = rows.slice(1).map((cells) => {
    const row: CsvRow = {};
    headers.forEach((header, i) => {
      row[header] = (cells[i] ?? "").trim();
    });
    return row;
  });
  return { headers, rows: data };
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/)[0] || "";
  
  const delimiters = [",", ";", "\t"];
  const counts = delimiters.map((delim) => {
    const count = firstLine.split(delim).length - 1;
    return { delimiter: delim, count };
  });
  
  const best = counts.reduce((a, b) => (b.count > a.count ? b : a));
  return best.count > 0 ? best.delimiter : ",";
}

function splitCsv(text: string, delimiter = ","): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === delimiter) {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      lines.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    lines.push(row);
  }
  return lines;
}

export function csvCell(row: CsvRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key.toLowerCase()];
    if (value) return value;
  }
  return "";
}

export async function parseExcel(buffer: ArrayBuffer): Promise<{ headers: string[]; rows: CsvRow[] }> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return { headers: [], rows: [] };
  
  return parseWorksheet(worksheet);
}

function parseWorksheet(worksheet: Worksheet): { headers: string[]; rows: CsvRow[] } {
  const allRows: string[][] = [];
  
  worksheet.eachRow((row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cells[colNumber - 1] = formatCellValue(cell);
    });
    
    if (cells.some((cell) => cell.trim())) {
      allRows.push(cells);
    }
  });
  
  if (allRows.length === 0) return { headers: [], rows: [] };
  
  const headers = allRows[0]
    .map((h) => (h || "").trim().toLowerCase())
    .filter((h) => h);
  
  const rows = allRows.slice(1).map((cells) => {
    const row: CsvRow = {};
    headers.forEach((header, i) => {
      row[header] = (cells[i] ?? "").trim();
    });
    return row;
  });
  
  return { headers, rows };
}

function formatCellValue(cell: Cell): string {
  if (cell.value === null || cell.value === undefined) return "";
  
  if (cell.type === 1) {
    return String(cell.value);
  }
  
  if (cell.type === 2) {
    const numValue = cell.value as number;
    
    if (cell.numFmt && (cell.numFmt.includes("m/d") || cell.numFmt.includes("d/m"))) {
      return cell.text || String(numValue);
    }
    
    if (Number.isInteger(numValue)) {
      return String(numValue);
    }
    
    return String(numValue);
  }
  
  if (cell.type === 3) {
    return cell.text || String(cell.value);
  }
  
  if (cell.type === 4) {
    const dateValue = cell.value as Date;
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return cell.text || dateValue.toISOString().split("T")[0];
    }
    return String(cell.value);
  }
  
  if (cell.type === 5) {
    return "";
  }
  
  if (cell.type === 6) {
    const formulaValue = cell.value as { text?: string; result?: string | number };
    return formulaValue.text || String(formulaValue.result || "");
  }
  
  if (typeof cell.value === "object" && cell.value !== null) {
    const objValue = cell.value as unknown as Record<string, unknown>;
    if ("text" in objValue) return String(objValue.text);
    if ("richText" in objValue) {
      const richText = objValue.richText as Array<{ text: string }>;
      return richText.map((t) => t.text).join("");
    }
  }
  
  return cell.text || String(cell.value);
}
