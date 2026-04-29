import { DEFAULT_SETTINGS, DEFAULT_TRACKER_STATE, FOCUS_RECORD_MAX_COUNT, RULE_ID_COUNT } from "./constants";
import { uniqueDomains } from "./domain";
import { clearTimelineSegments, restoreTimelineSegments } from "./timeline-db";
import type { FocusRecord, FocusSession, FocusSettings, TimeStats, TrackerState } from "./types";

const SETTINGS_KEY = "settings";
const SESSION_KEY = "focusSession";
const RECORDS_KEY = "focusRecords";
const STATS_KEY = "timeStats";
const TRACKER_KEY = "trackerState";

export async function getSettings(): Promise<FocusSettings> {
  const result = await chrome.storage.local.get({ [SETTINGS_KEY]: DEFAULT_SETTINGS });
  return normalizeSettings(result[SETTINGS_KEY] as Partial<FocusSettings>);
}

export async function saveSettings(settings: FocusSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: normalizeSettings(settings) });
}

export async function getFocusSession(): Promise<FocusSession | null> {
  const result = await chrome.storage.local.get({ [SESSION_KEY]: null });
  return result[SESSION_KEY] as FocusSession | null;
}

export async function saveFocusSession(session: FocusSession | null): Promise<void> {
  await chrome.storage.local.set({ [SESSION_KEY]: session });
}

export async function getFocusRecords(): Promise<FocusRecord[]> {
  const result = await chrome.storage.local.get({ [RECORDS_KEY]: [] });
  return result[RECORDS_KEY] as FocusRecord[];
}

export async function saveFocusRecords(records: FocusRecord[]): Promise<void> {
  await chrome.storage.local.set({ [RECORDS_KEY]: records.slice(-FOCUS_RECORD_MAX_COUNT) });
}

export async function addFocusRecord(record: FocusRecord): Promise<void> {
  const records = await getFocusRecords();
  records.push(record);
  await saveFocusRecords(records);
}

export async function getTimeStats(): Promise<TimeStats> {
  const result = await chrome.storage.local.get({ [STATS_KEY]: { days: {} } });
  return result[STATS_KEY] as TimeStats;
}

export async function saveTimeStats(stats: TimeStats): Promise<void> {
  await chrome.storage.local.set({ [STATS_KEY]: stats });
}

export async function getTrackerState(): Promise<TrackerState> {
  const result = await chrome.storage.local.get({ [TRACKER_KEY]: DEFAULT_TRACKER_STATE });
  return { ...DEFAULT_TRACKER_STATE, ...(result[TRACKER_KEY] as Partial<TrackerState>) };
}

export async function saveTrackerState(state: TrackerState): Promise<void> {
  await chrome.storage.local.set({ [TRACKER_KEY]: state });
}

export async function clearTimeStats(): Promise<void> {
  await chrome.storage.local.set({ [STATS_KEY]: { days: {} }, [RECORDS_KEY]: [] });
  await clearTimelineSegments();
}

export async function restoreDataBackup(input: unknown): Promise<{ dayCount: number; recordCount: number; segmentCount: number }> {
  const backup = readBackup(input);
  const [currentSettings, currentStats, currentRecords] = await Promise.all([
    getSettings(),
    getTimeStats(),
    getFocusRecords()
  ]);
  const stats = mergeTimeStats(currentStats, backup.stats);
  const records = mergeFocusRecords(currentRecords, backup.records);

  await chrome.storage.local.set({
    [SETTINGS_KEY]: mergeSettings(currentSettings, backup.settings),
    [STATS_KEY]: stats,
    [RECORDS_KEY]: records.slice(-FOCUS_RECORD_MAX_COUNT)
  });
  const segmentCount = await restoreTimelineSegments(backup.timelineSegments);

  return {
    dayCount: Object.keys(backup.stats.days).length,
    recordCount: backup.records.length,
    segmentCount
  };
}

function normalizeSettings(settings: Partial<FocusSettings>): FocusSettings {
  return {
    globalBlacklist: uniqueDomains(settings.globalBlacklist ?? DEFAULT_SETTINGS.globalBlacklist).slice(0, RULE_ID_COUNT),
    blacklist: uniqueDomains(settings.blacklist ?? DEFAULT_SETTINGS.blacklist).slice(0, RULE_ID_COUNT),
    whitelist: uniqueDomains(settings.whitelist ?? DEFAULT_SETTINGS.whitelist).slice(0, RULE_ID_COUNT),
    categories: {
      ...DEFAULT_SETTINGS.categories,
      ...(settings.categories ?? {})
    },
    dailyFocusGoalMinutes: settings.dailyFocusGoalMinutes ?? DEFAULT_SETTINGS.dailyFocusGoalMinutes,
    defaultFocusMinutes: settings.defaultFocusMinutes ?? DEFAULT_SETTINGS.defaultFocusMinutes,
    blockMode: settings.blockMode ?? DEFAULT_SETTINGS.blockMode
  };
}

function readBackup(input: unknown): { settings: FocusSettings; stats: TimeStats; records: FocusRecord[]; timelineSegments: unknown[] } {
  const source = isRecord(input) ? input : {};
  const statsSource = isRecord(source.stats) ? source.stats : isRecord(source.timeStats) ? source.timeStats : {};
  const recordsSource = Array.isArray(source.focusRecords) ? source.focusRecords : [];
  const settingsSource = isRecord(source.settings) ? source.settings : {};
  const timelineSegments = Array.isArray(source.timelineSegments) ? source.timelineSegments : [];

  return {
    settings: normalizeSettings(settingsSource as Partial<FocusSettings>),
    stats: normalizeTimeStats(statsSource),
    records: normalizeFocusRecords(recordsSource),
    timelineSegments
  };
}

function normalizeTimeStats(input: unknown): TimeStats {
  const daysSource = isRecord(input) && isRecord(input.days) ? input.days : {};
  const days: TimeStats["days"] = {};

  for (const [dayKey, value] of Object.entries(daysSource)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey) || !isRecord(value)) continue;
    const day: Record<string, number> = {};
    for (const [domain, ms] of Object.entries(value)) {
      if (typeof domain !== "string" || typeof ms !== "number" || !Number.isFinite(ms) || ms <= 0) continue;
      day[domain] = Math.round(ms);
    }
    if (Object.keys(day).length > 0) days[dayKey] = day;
  }

  return { days };
}

function normalizeFocusRecords(input: unknown[]): FocusRecord[] {
  return input.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = typeof item.id === "string" ? item.id : "";
    const startedAt = typeof item.startedAt === "number" ? item.startedAt : 0;
    const endedAt = typeof item.endedAt === "number" ? item.endedAt : 0;
    const plannedMinutes = typeof item.plannedMinutes === "number" ? item.plannedMinutes : 0;
    const focusedMs = typeof item.focusedMs === "number" ? item.focusedMs : 0;
    const mode = item.mode === "whitelist" ? "whitelist" : item.mode === "blacklist" ? "blacklist" : null;
    const completed = typeof item.completed === "boolean" ? item.completed : false;
    if (!id || !startedAt || !endedAt || !plannedMinutes || focusedMs < 0 || !mode) return [];
    return [{ id, startedAt, endedAt, plannedMinutes, focusedMs, mode, completed }];
  });
}

function mergeTimeStats(current: TimeStats, backup: TimeStats): TimeStats {
  const days: TimeStats["days"] = { ...current.days };
  for (const [dayKey, day] of Object.entries(backup.days)) {
    days[dayKey] = { ...(days[dayKey] ?? {}) };
    for (const [domain, ms] of Object.entries(day)) {
      days[dayKey][domain] = Math.max(days[dayKey][domain] ?? 0, ms);
    }
  }
  return { days };
}

function mergeFocusRecords(current: FocusRecord[], backup: FocusRecord[]): FocusRecord[] {
  const byId = new Map(current.map((record) => [record.id, record]));
  for (const record of backup) byId.set(record.id, record);
  return Array.from(byId.values()).sort((a, b) => a.startedAt - b.startedAt);
}

function mergeSettings(current: FocusSettings, backup: FocusSettings): FocusSettings {
  return normalizeSettings({
    ...current,
    categories: { ...current.categories, ...backup.categories },
    globalBlacklist: uniqueDomains([...current.globalBlacklist, ...backup.globalBlacklist]),
    blacklist: uniqueDomains([...current.blacklist, ...backup.blacklist]),
    whitelist: uniqueDomains([...current.whitelist, ...backup.whitelist]),
    dailyFocusGoalMinutes: backup.dailyFocusGoalMinutes || current.dailyFocusGoalMinutes,
    defaultFocusMinutes: backup.defaultFocusMinutes || current.defaultFocusMinutes,
    blockMode: backup.blockMode ?? current.blockMode
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
