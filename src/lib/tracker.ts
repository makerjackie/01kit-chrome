import { TRACKER_TICK_ALARM } from "./constants";
import { domainFromUrl, isExcludedDomain } from "./domain";
import { getSettings, getTimeStats, getTrackerState, saveTimeStats, saveTrackerState } from "./storage";
import { addDomainTime } from "./stats";
import type { TrackerState } from "./types";

const MIN_SEGMENT_MS = 1_000;
const MAX_TRACKABLE_SEGMENT_MS = 5 * 60_000;

export async function setupTracker(): Promise<void> {
  chrome.idle.setDetectionInterval(60);
  await chrome.alarms.create(TRACKER_TICK_ALARM, { periodInMinutes: 1 });
  await syncActiveTracking("startup");
}

export async function syncActiveTracking(_reason: string): Promise<void> {
  await closeCurrentSegment();
  const next = await getCurrentTrackableState();
  await saveTrackerState(next);
}

export async function handleTrackerTick(): Promise<void> {
  await closeCurrentSegment();
  const state = await getTrackerState();
  if (state.domain && state.windowFocused && !state.idle) {
    await saveTrackerState({ ...state, startedAt: Date.now() });
  } else {
    await syncActiveTracking("tick");
  }
}

export async function setWindowFocused(focused: boolean): Promise<void> {
  const state = await getTrackerState();
  if (state.windowFocused === focused) return;
  await closeCurrentSegment();
  if (!focused) {
    await saveTrackerState({ ...state, windowFocused: false, domain: null, startedAt: null });
    return;
  }
  await syncActiveTracking("window-focus");
}

export async function setIdleState(idle: boolean): Promise<void> {
  const state = await getTrackerState();
  if (state.idle === idle) return;
  await closeCurrentSegment();
  if (idle) {
    await saveTrackerState({ ...state, idle: true, domain: null, startedAt: null });
    return;
  }
  await syncActiveTracking("idle-active");
}

async function closeCurrentSegment(): Promise<void> {
  const state = await getTrackerState();
  if (!state.domain || !state.startedAt || !state.windowFocused || state.idle) return;

  const elapsed = Date.now() - state.startedAt;
  if (elapsed < MIN_SEGMENT_MS) return;
  if (elapsed > MAX_TRACKABLE_SEGMENT_MS) return;

  const settings = await getSettings();
  if (isExcludedDomain(state.domain, settings.trackingExclusions)) return;

  const stats = await getTimeStats();
  await saveTimeStats(addDomainTime(stats, state.domain, elapsed));
}

async function getCurrentTrackableState(): Promise<TrackerState> {
  const windows = await chrome.windows.getAll({ populate: false, windowTypes: ["normal"] });
  const focusedWindow = windows.find((item: { focused?: boolean; id?: number }) => item.focused);
  if (!focusedWindow?.id) {
    return { domain: null, startedAt: null, tabId: null, windowFocused: false, idle: false };
  }

  const idleState = await chrome.idle.queryState(60);
  if (idleState !== "active") {
    return { domain: null, startedAt: null, tabId: null, windowFocused: true, idle: true };
  }

  const [tab] = await chrome.tabs.query({ active: true, windowId: focusedWindow.id });
  const domain = domainFromUrl(tab?.url);
  const settings = await getSettings();

  if (!domain || isExcludedDomain(domain, settings.trackingExclusions)) {
    return { domain: null, startedAt: null, tabId: tab?.id ?? null, windowFocused: true, idle: false };
  }

  return {
    domain,
    startedAt: Date.now(),
    tabId: tab?.id ?? null,
    windowFocused: true,
    idle: false
  };
}
