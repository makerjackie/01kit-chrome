import { useEffect, useMemo, useRef, useState } from "react";
import {
  AUTHOR_EMAIL,
  DEFAULT_BLACKLIST,
  DEFAULT_WHITELIST,
  EXTENSION_TUTORIAL_URL,
  FEEDBACK_URL,
  REPOSITORY_URL,
  RULE_ID_COUNT
} from "../../src/lib/constants";
import { normalizeDomain } from "../../src/lib/domain";
import { getFocusStatus, pauseFocusSession, resumeFocusSession, startFocusSession, stopFocusSession } from "../../src/lib/focus";
import { openExternalUrl } from "../../src/lib/links";
import { getFocusRecords, getTimeStats, saveSettings } from "../../src/lib/storage";
import { getDomainStats, focusMsForDay } from "../../src/lib/stats";
import { clampMinutes, dateKey, formatCompactDuration, formatDuration } from "../../src/lib/time";
import type { FocusMode, FocusStatus } from "../../src/lib/types";

const presets = [25, 45, 60];
const pausePresets = [1, 5, 15];
const supportLinks = [
  { label: "反馈", url: FEEDBACK_URL },
  { label: "GitHub", url: REPOSITORY_URL },
  { label: "教程", url: EXTENSION_TUTORIAL_URL }
];

export default function App() {
  const [status, setStatus] = useState<FocusStatus | null>(null);
  const [todayMs, setTodayMs] = useState(0);
  const [topSites, setTopSites] = useState<{ domain: string; ms: number }[]>([]);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [domainInput, setDomainInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const loadedDefaultMinutes = useRef(false);

  const effectiveMode = status?.session?.mode ?? status?.settings.blockMode;
  const list = effectiveMode === "whitelist"
    ? status?.settings.whitelist ?? []
    : status?.settings.blacklist ?? [];
  const remaining = status?.remainingMs ?? 0;
  const selectedMinutes = clampMinutes(customMinutes);
  const pausedMs = status?.session?.pausedUntil ? Math.max(0, status.session.pausedUntil - (status?.now ?? Date.now())) : 0;
  const goalMs = (status?.settings.dailyFocusGoalMinutes ?? 120) * 60_000;
  const goalPct = goalMs > 0 ? Math.min(100, Math.round((todayMs / goalMs) * 100)) : 0;

  async function reload() {
    const nextStatus = await getFocusStatus();
    const [stats, records] = await Promise.all([getTimeStats(), getFocusRecords()]);
    setStatus(nextStatus);
    if (!loadedDefaultMinutes.current) {
      setCustomMinutes(nextStatus.settings.defaultFocusMinutes);
      loadedDefaultMinutes.current = true;
    }
    setTopSites(getDomainStats(stats, nextStatus.settings, "today").slice(0, 5));
    setTodayMs(focusMsForDay(records, dateKey()));
  }

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const title = useMemo(() => {
    if (!status?.session) return "准备开始";
    if (status.paused) return "暂停中";
    return "专注中";
  }, [status]);

  async function start(minutes: number) {
    if (!status) return;
    setSaving(true);
    try {
      await startFocusSession(clampMinutes(minutes), status.settings.blockMode);
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function updateMode(mode: FocusMode) {
    if (!status) return;
    if (status.session) return;
    const settings = { ...status.settings, blockMode: mode };
    await saveSettings(settings);
    setStatus({ ...status, settings });
  }

  async function addDomain() {
    if (!status) return;
    const domain = normalizeDomain(domainInput);
    if (!domain) return;
    const settings = { ...status.settings };
    const key = effectiveMode === "whitelist" ? "whitelist" : "blacklist";
    if (!settings[key].includes(domain) && settings[key].length >= RULE_ID_COUNT) return;
    settings[key] = Array.from(new Set([...settings[key], domain])).sort();
    await saveSettings(settings);
    setDomainInput("");
    setStatus({ ...status, settings });
  }

  async function removeDomain(domain: string) {
    if (!status) return;
    const settings = { ...status.settings };
    const key = effectiveMode === "whitelist" ? "whitelist" : "blacklist";
    settings[key] = settings[key].filter((item) => item !== domain);
    await saveSettings(settings);
    setStatus({ ...status, settings });
  }

  async function applyTemplate(kind: "common" | "work") {
    if (!status) return;
    const settings = { ...status.settings };
    if (kind === "common") {
      settings.blacklist = Array.from(new Set([...settings.blacklist, ...DEFAULT_BLACKLIST])).sort();
    } else {
      settings.whitelist = Array.from(new Set([...settings.whitelist, ...DEFAULT_WHITELIST])).sort();
    }
    await saveSettings(settings);
    setStatus({ ...status, settings });
  }

  return (
    <main className="popup">
      <section className="hero">
        <div>
          <p className="eyebrow">01Kit</p>
          <h1>{title}</h1>
        </div>
        <div className="timer">{status?.session ? formatDuration(remaining) : `${selectedMinutes} 分钟`}</div>
      </section>

      {status?.session ? (
        <section className="panel session-panel">
          <div className="progress">
            <span style={{ width: `${Math.max(3, 100 - (remaining / (status.session.durationMinutes * 60_000)) * 100)}%` }} />
          </div>
          {status.paused ? (
            <div className="paused-box">
              <span>暂停剩余 {formatDuration(pausedMs)}</span>
              <button className="primary" onClick={() => resumeFocusSession().then(reload)}>
                继续专注
              </button>
            </div>
          ) : null}
          <div className="actions three">
            {pausePresets.map((minutes) => (
              <button key={minutes} onClick={() => pauseFocusSession(minutes).then(reload)}>
                暂停 {minutes} 分
              </button>
            ))}
          </div>
          <button className="danger" onClick={() => stopFocusSession(false).then(reload)}>
            结束专注
          </button>
        </section>
      ) : (
        <section className="panel start-panel">
          <button className="primary start-button" disabled={saving} onClick={() => start(selectedMinutes)}>
            开始
          </button>
          <div className="preset-row" role="group" aria-label="选择专注时长">
            {presets.map((minutes) => (
              <button
                className={selectedMinutes === minutes ? "active" : ""}
                disabled={saving}
                key={minutes}
                onClick={() => setCustomMinutes(minutes)}
              >
                {minutes} 分钟
              </button>
            ))}
          </div>
          <div className="custom-row start-custom">
            <input
              aria-label="自定义专注分钟"
              min={1}
              max={240}
              type="number"
              value={customMinutes}
              onChange={(event) => setCustomMinutes(Number(event.target.value))}
            />
            <span>分钟</span>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="section-head">
          <h2>屏蔽规则</h2>
          <div className="segmented">
            <button className={effectiveMode === "blacklist" ? "active" : ""} disabled={Boolean(status?.session)} onClick={() => updateMode("blacklist")}>
              黑名单
            </button>
            <button className={effectiveMode === "whitelist" ? "active" : ""} disabled={Boolean(status?.session)} onClick={() => updateMode("whitelist")}>
              白名单
            </button>
          </div>
        </div>
        <div className="custom-row">
          <input
            placeholder="example.com"
            value={domainInput}
            onChange={(event) => setDomainInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void addDomain();
            }}
          />
          <button disabled={list.length >= RULE_ID_COUNT} onClick={addDomain}>添加</button>
        </div>
        <div className="template-row">
          <button onClick={() => applyTemplate("common")}>常见干扰</button>
          <button onClick={() => applyTemplate("work")}>工作白名单</button>
        </div>
        <div className="domain-list">
          {list.slice(0, 8).map((domain) => (
            <span key={domain}>
              {domain}
              <button aria-label={`删除 ${domain}`} onClick={() => removeDomain(domain)}>
                ×
              </button>
            </span>
          ))}
          <small>{list.length} / {RULE_ID_COUNT}</small>
          {list.length > 8 ? <small>还有 {list.length - 8} 个，在设置页管理</small> : null}
        </div>
      </section>

      <section className="panel stats">
        <div className="section-head">
          <h2>今日</h2>
          <span>{formatCompactDuration(todayMs)} / {formatCompactDuration(goalMs)}</span>
        </div>
        <div className="goal">
          <span style={{ width: `${goalPct}%` }} />
        </div>
        {topSites.length > 0 ? (
          <div className="site-list">
            {topSites.map((site) => (
              <div key={site.domain}>
                <span>{site.domain}</span>
                <strong>{formatCompactDuration(site.ms)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">今天还没有可展示的访问记录。</p>
        )}
      </section>

      <button className="options" onClick={() => chrome.runtime.openOptionsPage()}>
        打开完整设置
      </button>

      <section className="support-strip" aria-label="帮助链接">
        {supportLinks.map((item) => (
          <button key={item.label} onClick={() => openExternalUrl(item.url)}>
            {item.label}
          </button>
        ))}
        <button onClick={() => setShowContact((value) => !value)}>
          联系
        </button>
      </section>

      {showContact ? (
        <div className="contact-line">
          <span>联系作者</span>
          <a href={`mailto:${AUTHOR_EMAIL}`}>{AUTHOR_EMAIL}</a>
        </div>
      ) : null}
    </main>
  );
}
