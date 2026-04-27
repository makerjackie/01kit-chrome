import {
  DEFAULT_FOCUS_MINUTES,
  FOCUS_END_ALARM,
  FOCUS_PAUSE_END_ALARM,
  QUOTES,
  RULE_ID_BASE,
  RULE_ID_COUNT
} from "./constants";
import { uniqueDomains } from "./domain";
import {
  addFocusRecord,
  getFocusSession,
  getSettings,
  saveFocusSession
} from "./storage";
import type { FocusMode, FocusSession, FocusStatus } from "./types";

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
  await clearBlockingRules();
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
  await clearBlockingRules();

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
    else await clearBlockingRules();
    return;
  }

  if (status.paused) {
    await clearBlockingRules();
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

  const rules = buildRules(updatedSession);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ruleIds(),
    addRules: rules
  });
}

export async function clearBlockingRules(): Promise<void> {
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ruleIds()
  });
}

export function getRandomQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)] ?? QUOTES[0];
}

function buildRules(session: FocusSession): any[] {
  if (session.mode === "whitelist") {
    return [
      {
        id: RULE_ID_BASE,
        priority: 1,
        action: redirectAction(),
        condition: {
          regexFilter: "^https?://",
          excludedRequestDomains: session.domains,
          resourceTypes: ["main_frame"]
        }
      }
    ];
  }

  return session.domains.slice(0, RULE_ID_COUNT).map((domain, index) => ({
    id: RULE_ID_BASE + index,
    priority: 1,
    action: redirectAction(),
    condition: {
      regexFilter: "^https?://",
      requestDomains: [domain],
      resourceTypes: ["main_frame"]
    }
  }));
}

function redirectAction(): any {
  const blockedUrl = chrome.runtime.getURL("/blocked.html");

  return {
    type: "redirect",
    redirect: {
      regexSubstitution: `${blockedUrl}#\\0`
    }
  };
}

function ruleIds(): number[] {
  return Array.from({ length: RULE_ID_COUNT }, (_, index) => RULE_ID_BASE + index);
}
