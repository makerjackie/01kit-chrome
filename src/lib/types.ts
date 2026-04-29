export type FocusMode = "blacklist" | "whitelist";

export type StatsRange = "today" | "week" | "month";

export type SiteCategory =
  | "work"
  | "learn"
  | "social"
  | "entertainment"
  | "video"
  | "news"
  | "shopping"
  | "other";

export interface FocusSettings {
  globalBlacklist: string[];
  blacklist: string[];
  whitelist: string[];
  categories: Record<string, SiteCategory>;
  dailyFocusGoalMinutes: number;
  defaultFocusMinutes: number;
  blockMode: FocusMode;
}

export interface FocusSession {
  id: string;
  active: boolean;
  mode: FocusMode;
  startedAt: number;
  endsAt: number;
  pausedUntil?: number;
  pauseStartedAt?: number;
  pausedMs?: number;
  durationMinutes: number;
  domains: string[];
}

export interface FocusRecord {
  id: string;
  startedAt: number;
  endedAt: number;
  plannedMinutes: number;
  focusedMs: number;
  mode: FocusMode;
  completed: boolean;
}

export interface TimeStats {
  days: Record<string, Record<string, number>>;
}

export interface TimeSegment {
  id: string;
  day: string;
  domain: string;
  startedAt: number;
  endedAt: number;
  ms: number;
}

export interface TrackerState {
  domain: string | null;
  startedAt: number | null;
  tabId: number | null;
  windowFocused: boolean;
  idle: boolean;
}

export interface DomainStat {
  domain: string;
  ms: number;
  category: SiteCategory;
}

export interface FocusStatus {
  settings: FocusSettings;
  session: FocusSession | null;
  now: number;
  remainingMs: number;
  paused: boolean;
  blocking: boolean;
}
