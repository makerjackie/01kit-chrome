import {
  DEFAULT_FOCUS_MINUTES,
  FOCUS_END_ALARM,
  FOCUS_PAUSE_END_ALARM,
  GLOBAL_ALLOW_RULE_ID_BASE,
  GLOBAL_RULE_ID_BASE,
  QUOTES,
  RULE_ID_BASE,
  RULE_ID_COUNT
} from "./constants";
import { domainFromUrl, uniqueDomains } from "./domain";
import {
  addFocusRecord,
  getFocusSession,
  getSettings,
  saveFocusSession
} from "./storage";
import type { FocusMode, FocusSession, FocusSettings, FocusStatus } from "./types";

export async function getFocusStatus(now = Date.now()): Promise<FocusStatus> {
  const settings = await getSettings();
  const session = await getFocusSession();
  const active = session?.active && session.endsAt > now ? session : null;
  const paused = Boolean(active?.pausedUntil && active.pausedUntil > now);
  const remainingMs = active ? Math.max(0, active.endsAt - now) : 0;

  return {
    settings,
    session: active,
    now,
    remainingMs,
    paused,
    blocking: Boolean(active && !paused)
  };
}

export async function startFocusSession(
  durationMinutes = DEFAULT_FOCUS_MINUTES,
  mode?: FocusMode
): Promise<FocusSession> {
  const settings = await getSettings();
  const duration = Math.max(1, Math.min(240, Math.round(durationMinutes)));
  const activeMode = mode ?? settings.blockMode;
  const domains = activeMode === "blacklist" ? settings.blacklist : settings.whitelist;
  const now = Date.now();
  const session: FocusSession = {
    id: crypto.randomUUID(),
    active: true,
    mode: activeMode,
    startedAt: now,
    endsAt: now + duration * 60_000,
    durationMinutes: duration,
    domains: uniqueDomains(domains)
  };

  await saveFocusSession(session);
  await chrome.alarms.clear(FOCUS_PAUSE_END_ALARM);
  await chrome.alarms.create(FOCUS_END_ALARM, { when: session.endsAt });
  await refreshBlockingRules();
  return session;
}

export async function pauseFocusSession(minutes: number): Promise<void> {
  const session = await getFocusSession();
  if (!session?.active) return;

  const now = Date.now();
  session.pauseStartedAt = session.pauseStartedAt ?? now;
  session.pausedUntil = now + Math.max(1, Math.round(minutes)) * 60_000;
  await saveFocusSession(session);
  await refreshBlockingRules();
  await chrome.alarms.create(FOCUS_PAUSE_END_ALARM, { when: session.pausedUntil });
}

export async function resumeFocusSession(): Promise<void> {
  const session = await getFocusSession();
  if (!session?.active) return;

  const now = Date.now();
  const pauseStartedAt = session.pauseStartedAt;
  const updatedSession: FocusSession = {
    ...session,
    pausedUntil: undefined,
    pauseStartedAt: undefined,
    pausedMs: pauseStartedAt ? (session.pausedMs ?? 0) + Math.max(0, now - pauseStartedAt) : session.pausedMs
  };

  await saveFocusSession(updatedSession);
  await chrome.alarms.clear(FOCUS_PAUSE_END_ALARM);
  await refreshBlockingRules();
}

export async function stopFocusSession(completed = false): Promise<void> {
  const session = await getFocusSession();
  if (!session) {
    await clearBlockingRules();
    return;
  }

  const now = Date.now();
  const activeUntil = Math.min(now, session.endsAt);
  const currentPauseMs = session.pauseStartedAt ? Math.max(0, activeUntil - session.pauseStartedAt) : 0;
  const focusedMs = Math.max(0, activeUntil - session.startedAt - (session.pausedMs ?? 0) - currentPauseMs);
  await addFocusRecord({
    id: session.id,
    startedAt: session.startedAt,
    endedAt: now,
    plannedMinutes: session.durationMinutes,
    focusedMs,
    mode: session.mode,
    completed
  });

  await saveFocusSession(null);
  await chrome.alarms.clear(FOCUS_END_ALARM);
  await chrome.alarms.clear(FOCUS_PAUSE_END_ALARM);
  await refreshBlockingRules();

  if (completed) {
    await chrome.notifications.create(`01kit-focus-${session.id}`, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icon/icon-128.png"),
      title: "01Kit 专注结束",
      message: "这段专注已经完成。"
    });
  }
}

export async function refreshBlockingRules(): Promise<void> {
  const status = await getFocusStatus();
  const session = status.session;

  if (!session) {
    const staleSession = await getFocusSession();
    if (staleSession) await stopFocusSession(true);
    else await updateBlockingRules(buildGlobalRules(status.settings));
    return;
  }

  if (status.paused) {
    await updateBlockingRules(buildGlobalRules(status.settings));
    return;
  }

  const domains = status.settings[session.mode === "blacklist" ? "blacklist" : "whitelist"];
  const pauseStartedAt = session.pauseStartedAt;
  const updatedSession: FocusSession = {
    ...session,
    pausedUntil: undefined,
    pauseStartedAt: undefined,
    pausedMs: pauseStartedAt ? (session.pausedMs ?? 0) + Math.max(0, Date.now() - pauseStartedAt) : session.pausedMs,
    domains: uniqueDomains(domains)
  };

  await saveFocusSession(updatedSession);

  await updateBlockingRules([
    ...buildGlobalRules(status.settings),
    ...buildFocusRules(updatedSession)
  ]);
}

export async function clearBlockingRules(): Promise<void> {
  await updateBlockingRules([]);
}

export async function allowGlobalBlacklistUrlOnce(tabId: number, url: string): Promise<boolean> {
  const domain = domainFromUrl(url);
  if (!domain) return false;

  const ruleId = allowRuleIdForTab(tabId);
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [ruleId],
    addRules: [
      {
        id: ruleId,
        priority: 10,
        action: { type: "allow" },
        condition: {
          requestDomains: [domain],
          resourceTypes: ["main_frame"],
          tabIds: [tabId]
        }
      }
    ]
  });

  return true;
}

export async function clearGlobalBlacklistAllow(tabId: number): Promise<void> {
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [allowRuleIdForTab(tabId)]
  });
}

export function getRandomQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)] ?? QUOTES[0];
}

function buildGlobalRules(settings: FocusSettings): any[] {
  return uniqueDomains(settings.globalBlacklist).slice(0, RULE_ID_COUNT).map((domain, index) => ({
    id: GLOBAL_RULE_ID_BASE + index,
    priority: 1,
    action: redirectAction("global"),
    condition: {
      regexFilter: "^(https?://.*)",
      requestDomains: [domain],
      resourceTypes: ["main_frame"]
    }
  }));
}

function buildFocusRules(session: FocusSession): any[] {
  if (session.mode === "whitelist") {
    return [
      {
        id: RULE_ID_BASE,
        priority: 1,
        action: redirectAction("focus"),
        condition: {
          regexFilter: "^(https?://.*)",
          excludedRequestDomains: session.domains,
          resourceTypes: ["main_frame"]
        }
      }
    ];
  }

  return session.domains.slice(0, RULE_ID_COUNT).map((domain, index) => ({
    id: RULE_ID_BASE + index,
    priority: 1,
    action: redirectAction("focus"),
    condition: {
      regexFilter: "^(https?://.*)",
      requestDomains: [domain],
      resourceTypes: ["main_frame"]
    }
  }));
}

function redirectAction(reason: "focus" | "global"): any {
  const blockedUrl = chrome.runtime.getURL("/blocked.html");

  return {
    type: "redirect",
    redirect: {
      regexSubstitution: `${blockedUrl}?reason=${reason}#\\1`
    }
  };
}

function ruleIds(): number[] {
  return [
    ...Array.from({ length: RULE_ID_COUNT }, (_, index) => RULE_ID_BASE + index),
    ...Array.from({ length: RULE_ID_COUNT }, (_, index) => GLOBAL_RULE_ID_BASE + index)
  ];
}

async function updateBlockingRules(rules: any[]): Promise<void> {
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ruleIds(),
    addRules: rules
  });
}

function allowRuleIdForTab(tabId: number): number {
  return GLOBAL_ALLOW_RULE_ID_BASE + tabId;
}
