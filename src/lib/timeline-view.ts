import { dateKey, formatDuration, startOfDay } from "./time";
import type { TimeSegment, TrackerState } from "./types";

export const TIMELINE_COLORS = ["#1f6feb", "#0f8b8d", "#c77d00", "#b42318", "#7048e8", "#2f9e44", "#ad1457", "#5f6c7b"];
export const OTHER_TIMELINE_COLOR = "#a8a29a";
export const IDLE_TIMELINE_COLOR = "#e7e0d2";
const DISPLAY_MERGE_GAP_MS = 60_000;
const MIN_VISIBLE_SEGMENT_MS = 1_000;

export interface TimelineBlock {
  id: string;
  kind: "site" | "idle";
  domain: string;
  startedAt: number;
  endedAt: number;
  ms: number;
  leftPct: number;
  widthPct: number;
  tooltipAlign: "start" | "center" | "end";
  color: string;
  tooltip: string;
}

export interface TimelineLegendItem {
  domain: string;
  color: string;
}

export interface TimelineView {
  startedAt: number;
  endedAt: number;
  hasOther: boolean;
  hasIdle: boolean;
  legend: TimelineLegendItem[];
  blocks: TimelineBlock[];
}

export function buildTimelineView(segments: TimeSegment[], now = Date.now()): TimelineView {
  const sorted = mergeTimelineSegments(segments).sort((a, b) => a.startedAt - b.startedAt);
  if (sorted.length === 0) {
    return {
      startedAt: now,
      endedAt: now,
      hasOther: false,
      hasIdle: false,
      legend: [],
      blocks: []
    };
  }

  const startedAt = sorted[0]?.startedAt ?? now;
  const endedAt = Math.max(now, sorted.at(-1)?.endedAt ?? startedAt);
  const duration = Math.max(1, endedAt - startedAt);
  const colorByDomain = buildDomainColors(sorted);
  const blocks: TimelineBlock[] = [];
  let cursor = startedAt;

  for (const segment of sorted) {
    if (segment.startedAt > cursor) {
      blocks.push(makeIdleBlock(cursor, segment.startedAt, startedAt, duration));
    }

    blocks.push(makeSiteBlock(segment, startedAt, duration, colorByDomain.get(segment.domain) ?? OTHER_TIMELINE_COLOR));
    cursor = Math.max(cursor, segment.endedAt);
  }

  if (cursor < endedAt) {
    blocks.push(makeIdleBlock(cursor, endedAt, startedAt, duration));
  }

  const topDomains = Array.from(colorByDomain.keys());

  return {
    startedAt,
    endedAt,
    hasOther: sorted.some((segment) => !colorByDomain.has(segment.domain)),
    hasIdle: blocks.some((block) => block.kind === "idle"),
    legend: topDomains.map((domain) => ({
      domain,
      color: colorByDomain.get(domain) ?? OTHER_TIMELINE_COLOR
    })),
    blocks
  };
}

export function withActiveTimelineSegment(segments: TimeSegment[], trackerState: TrackerState | null, now = Date.now()): TimeSegment[] {
  if (
    !trackerState?.domain
    || !trackerState.startedAt
    || !trackerState.windowFocused
    || trackerState.idle
    || now <= trackerState.startedAt
  ) {
    return segments;
  }

  const startedAt = Math.max(trackerState.startedAt, startOfDay(now));
  const ms = now - startedAt;
  if (ms < MIN_VISIBLE_SEGMENT_MS) return segments;

  return [
    ...segments,
    {
      id: `active-${startedAt}-${now}-${trackerState.domain}`,
      day: dateKey(startedAt),
      domain: trackerState.domain,
      startedAt,
      endedAt: now,
      ms
    }
  ];
}

function mergeTimelineSegments(segments: TimeSegment[]): TimeSegment[] {
  const sorted = segments
    .filter((segment) => segment.ms > 0 && segment.endedAt > segment.startedAt)
    .slice()
    .sort((a, b) => a.startedAt - b.startedAt);
  const mergedRaw: TimeSegment[] = [];

  for (const segment of sorted) {
    const previous = mergedRaw.at(-1);
    if (
      previous
      && previous.domain === segment.domain
      && segment.startedAt - previous.endedAt <= DISPLAY_MERGE_GAP_MS
    ) {
      previous.endedAt = Math.max(previous.endedAt, segment.endedAt);
      previous.ms = previous.endedAt - previous.startedAt;
      previous.id = `${previous.startedAt}-${previous.endedAt}-${previous.domain}`;
      continue;
    }

    mergedRaw.push({ ...segment });
  }

  return mergedRaw.filter((segment) => segment.ms >= MIN_VISIBLE_SEGMENT_MS);
}

export function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function buildDomainColors(segments: TimeSegment[]): Map<string, string> {
  const domainTotals = new Map<string, number>();
  for (const segment of segments) {
    domainTotals.set(segment.domain, (domainTotals.get(segment.domain) ?? 0) + segment.ms);
  }

  const topDomains = Array.from(domainTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, TIMELINE_COLORS.length)
    .map(([domain]) => domain);

  return new Map(topDomains.map((domain, index) => [domain, TIMELINE_COLORS[index] ?? OTHER_TIMELINE_COLOR]));
}

function makeSiteBlock(segment: TimeSegment, timelineStart: number, timelineDuration: number, color: string): TimelineBlock {
  const { leftPct, widthPct } = getBlockPosition(segment.startedAt, segment.endedAt, timelineStart, timelineDuration);
  return {
    id: segment.id,
    kind: "site",
    domain: segment.domain,
    startedAt: segment.startedAt,
    endedAt: segment.endedAt,
    ms: segment.ms,
    leftPct,
    widthPct,
    tooltipAlign: getTooltipAlign(leftPct, widthPct),
    color,
    tooltip: `${formatClock(segment.startedAt)} - ${formatClock(segment.endedAt)} · ${segment.domain} · ${formatDuration(segment.ms)}`
  };
}

function makeIdleBlock(startedAt: number, endedAt: number, timelineStart: number, timelineDuration: number): TimelineBlock {
  const ms = endedAt - startedAt;
  const { leftPct, widthPct } = getBlockPosition(startedAt, endedAt, timelineStart, timelineDuration);
  return {
    id: `idle-${startedAt}-${endedAt}`,
    kind: "idle",
    domain: "未统计",
    startedAt,
    endedAt,
    ms,
    leftPct,
    widthPct,
    tooltipAlign: getTooltipAlign(leftPct, widthPct),
    color: IDLE_TIMELINE_COLOR,
    tooltip: `${formatClock(startedAt)} - ${formatClock(endedAt)} · 未统计 · ${formatDuration(ms)}`
  };
}

function getBlockPosition(startedAt: number, endedAt: number, timelineStart: number, timelineDuration: number): Pick<TimelineBlock, "leftPct" | "widthPct"> {
  const leftPct = Math.min(100, Math.max(0, ((startedAt - timelineStart) / timelineDuration) * 100));
  const rightPct = Math.min(100, Math.max(leftPct, ((endedAt - timelineStart) / timelineDuration) * 100));
  return {
    leftPct,
    widthPct: Math.max(0.25, rightPct - leftPct)
  };
}

function getTooltipAlign(leftPct: number, widthPct: number): TimelineBlock["tooltipAlign"] {
  if (leftPct < 12) return "start";
  if (leftPct + widthPct > 88) return "end";
  return "center";
}
