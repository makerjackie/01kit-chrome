import { DEFAULT_SETTINGS, DEFAULT_TRACKER_STATE, RULE_ID_COUNT } from "./constants";
import { uniqueDomains } from "./domain";
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
  await chrome.storage.local.set({ [RECORDS_KEY]: records.slice(-300) });
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
}

function normalizeSettings(settings: Partial<FocusSettings>): FocusSettings {
  return {
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
