import {
  FOCUS_END_ALARM,
  FOCUS_PAUSE_END_ALARM,
  TRACKER_TICK_ALARM
} from "../src/lib/constants";
import {
  allowGlobalBlacklistUrlOnce,
  clearGlobalBlacklistAllow,
  pauseFocusSession,
  refreshBlockingRules,
  startFocusSession,
  stopFocusSession
} from "../src/lib/focus";
import { getSettings } from "../src/lib/storage";
import {
  handleTrackerTick,
  setIdleState,
  setWindowFocused,
  setupTracker,
  syncActiveTracking
} from "../src/lib/tracker";

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(async () => {
    await setupTracker();
    await refreshBlockingRules();
  });

  chrome.runtime.onStartup.addListener(async () => {
    await setupTracker();
    await refreshBlockingRules();
  });

  chrome.alarms.onAlarm.addListener((alarm: { name: string }) => {
    void (async () => {
      if (alarm.name === FOCUS_END_ALARM) {
        await stopFocusSession(true);
      }

      if (alarm.name === FOCUS_PAUSE_END_ALARM) {
        await refreshBlockingRules();
      }

      if (alarm.name === TRACKER_TICK_ALARM) {
        await handleTrackerTick();
      }
    })();
  });

  chrome.tabs.onActivated.addListener(() => {
    void syncActiveTracking("tab-activated");
  });

  chrome.tabs.onUpdated.addListener((_tabId: number, changeInfo: { url?: string; status?: string }) => {
    if (changeInfo.url || changeInfo.status === "complete") {
      void syncActiveTracking("tab-updated");
    }

    if (changeInfo.status === "complete") {
      void clearGlobalBlacklistAllow(_tabId);
    }
  });

  chrome.tabs.onRemoved.addListener((tabId: number) => {
    void clearGlobalBlacklistAllow(tabId);
  });

  chrome.windows.onFocusChanged.addListener((windowId: number) => {
    void setWindowFocused(windowId !== chrome.windows.WINDOW_ID_NONE);
  });

  chrome.idle.onStateChanged.addListener((state: string) => {
    void setIdleState(state !== "active");
  });

  chrome.storage.onChanged.addListener((changes: Record<string, unknown>, areaName: string) => {
    if (areaName === "local" && changes.settings) {
      void refreshBlockingRules();
      void syncActiveTracking("settings-changed");
    }
  });

  chrome.commands.onCommand.addListener((command: string) => {
    void (async () => {
      if (command === "quick-focus") {
        const settings = await getSettings();
        await startFocusSession(settings.defaultFocusMinutes, settings.blockMode);
      }

      if (command === "pause-focus") {
        await pauseFocusSession(5);
      }
    })();
  });

  chrome.runtime.onMessage.addListener((message: { type?: string; url?: string }, sender: any, sendResponse: (response: { ok: boolean }) => void) => {
    if (message?.type !== "ALLOW_GLOBAL_BLACKLIST_URL_ONCE" || !message.url || !sender.tab?.id) {
      return false;
    }

    void allowGlobalBlacklistUrlOnce(sender.tab.id, message.url)
      .then((ok) => sendResponse({ ok }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  });

  void setupTracker();
  void refreshBlockingRules();
});
