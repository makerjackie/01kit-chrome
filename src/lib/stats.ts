import { TRACKER_MAX_DAYS } from "./constants";
import { dateKey, rangeKeys } from "./time";
import type { DomainStat, FocusRecord, FocusSettings, SiteCategory, StatsRange, TimeStats } from "./types";

export function addDomainTime(stats: TimeStats, domain: string, ms: number, now = Date.now()): TimeStats {
  if (!domain || ms <= 0) return stats;

  const startedAt = now - ms;
  for (const segment of splitDurationByDay(startedAt, now)) {
    const day = stats.days[segment.day] ?? {};
    day[domain] = (day[domain] ?? 0) + segment.ms;
    stats.days[segment.day] = day;
  }
  pruneStats(stats);
  return stats;
}

export function getDomainStats(
  stats: TimeStats,
  settings: FocusSettings,
  range: StatsRange,
  now = Date.now()
): DomainStat[] {
  const totals = new Map<string, number>();
  for (const key of rangeKeys(range, now)) {
    const day = stats.days[key] ?? {};
    for (const [domain, ms] of Object.entries(day)) {
      totals.set(domain, (totals.get(domain) ?? 0) + ms);
    }
  }

  return Array.from(totals.entries())
    .map(([domain, ms]) => ({
      domain,
      ms,
      category: settings.categories[domain] ?? autoCategory(domain)
    }))
    .sort((a, b) => b.ms - a.ms);
}

export function focusMsForDay(records: FocusRecord[], dayKey: string): number {
  return records
    .filter((record) => dateKey(record.startedAt) === dayKey)
    .reduce((total, record) => total + record.focusedMs, 0);
}

export function autoCategory(domain: string): SiteCategory {
  if (/(youtube|bilibili|douyin|tiktok|netflix|video)/.test(domain)) return "video";
  if (/(game|steam|epicgames|twitch|spotify|music|movie|anime)/.test(domain)) return "entertainment";
  if (/(x\.com|twitter|reddit|weibo|facebook|instagram|threads)/.test(domain)) return "social";
  if (/(news|nytimes|cnn|bbc|zhihu|medium)/.test(domain)) return "news";
  if (/(github|notion|linear|figma|vercel|cloudflare|docs|dev)/.test(domain)) return "work";
  if (/(course|learn|edu|developer|wxt|mdn)/.test(domain)) return "learn";
  if (/(taobao|jd|amazon|shop|mall)/.test(domain)) return "shopping";
  return "other";
}

function pruneStats(stats: TimeStats): void {
  const keys = Object.keys(stats.days).sort();
  const stale = keys.slice(0, Math.max(0, keys.length - TRACKER_MAX_DAYS));
  for (const key of stale) {
    delete stats.days[key];
  }
}

function splitDurationByDay(startedAt: number, endedAt: number): { day: string; ms: number }[] {
  const segments: { day: string; ms: number }[] = [];
  let cursor = startedAt;

  while (cursor < endedAt) {
    const nextDay = nextStartOfDay(cursor);
    const segmentEnd = Math.min(endedAt, nextDay);
    const ms = Math.max(0, segmentEnd - cursor);
    if (ms > 0) {
      segments.push({
        day: dateKey(cursor),
        ms
      });
    }
    cursor = segmentEnd;
  }

  return segments;
}

function nextStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  return date.getTime();
}
