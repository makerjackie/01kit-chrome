import type { DomainStat, FocusRecord, TimeStats } from "./types";
import { formatCompactDuration } from "./time";

export function downloadText(filename: string, content: string, mime = "text/plain;charset=utf-8"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function statsToJson(stats: TimeStats, records: FocusRecord[]): string {
  return JSON.stringify({ stats, focusRecords: records }, null, 2);
}

export function domainStatsToCsv(rows: DomainStat[]): string {
  const header = "domain,category,minutes,readable";
  const body = rows.map((row) => {
    const minutes = Math.round(row.ms / 60000);
    return [row.domain, row.category, minutes, formatCompactDuration(row.ms)]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",");
  });
  return [header, ...body].join("\n");
}
