import { useEffect, useMemo, useRef, useState } from "react";
import {
  AUTHOR_EMAIL,
  EXTENSION_TUTORIAL_URL,
  FEEDBACK_URL,
  REPOSITORY_URL,
  RULE_ID_COUNT
} from "../../src/lib/constants";
import { normalizeDomain } from "../../src/lib/domain";
import { getFocusStatus, pauseFocusSession, resumeFocusSession, startFocusSession, stopFocusSession } from "../../src/lib/focus";
import { openExternalUrl } from "../../src/lib/links";
import { getTimeStats, getTrackerState, saveSettings } from "../../src/lib/storage";
import { getDomainStats } from "../../src/lib/stats";
import { getTimelineSegmentsForDay } from "../../src/lib/timeline-db";
import { buildTimelineView, formatClock, IDLE_TIMELINE_COLOR, OTHER_TIMELINE_COLOR, withActiveTimelineSegment } from "../../src/lib/timeline-view";
import { clampMinutes, formatCompactDuration, formatDuration } from "../../src/lib/time";
import type { FocusMode, FocusStatus, TimeSegment } from "../../src/lib/types";

const presets = [25, 45, 60];
const pausePresets = [1, 5, 15];
const supportLinks = [
  { label: "反馈", url: FEEDBACK_URL },
  { label: "GitHub", url: REPOSITORY_URL },
  { label: "教程", url: EXTENSION_TUTORIAL_URL }
];

export default function App() {
  const [status, setStatus] = useState<FocusStatus | null>(null);
  const [todayBrowsingMs, setTodayBrowsingMs] = useState(0);
  const [topSites, setTopSites] = useState<{ domain: string; ms: number }[]>([]);
  const [timelineSegments, setTimelineSegments] = useState<TimeSegment[]>([]);
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
  const timeline = useMemo(() => buildTimelineView(timelineSegments), [timelineSegments]);

  async function reload() {
    const [nextStatus, stats, nextTimelineSegments, trackerState] = await Promise.all([
      getFocusStatus(),
      getTimeStats(),
      getTimelineSegmentsForDay(),
      getTrackerState()
    ]);
    const todayRows = getDomainStats(stats, nextStatus.settings, "today");
    setStatus(nextStatus);
    if (!loadedDefaultMinutes.current) {
      setCustomMinutes(nextStatus.settings.defaultFocusMinutes);
      loadedDefaultMinutes.current = true;
    }
    setTopSites(todayRows.slice(0, 5));
    setTodayBrowsingMs(todayRows.reduce((total, row) => total + row.ms, 0));
    setTimelineSegments(withActiveTimelineSegment(nextTimelineSegments, trackerState, nextStatus.now));
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

  function openTodayStats() {
    const url = chrome.runtime.getURL("options.html#time-stats");
    void chrome.tabs.create({ url });
  }

  function openRuleSettings() {
    const section = effectiveMode === "whitelist" ? "whitelist" : "blacklist";
    const url = chrome.runtime.getURL(`options.html#${section}`);
    void chrome.tabs.create({ url });
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
        <div className="domain-list">
          {list.slice(0, 3).map((domain) => (
            <span key={domain}>
              {domain}
              <button aria-label={`删除 ${domain}`} onClick={() => removeDomain(domain)}>
                ×
              </button>
            </span>
          ))}
          <small>{list.length} / {RULE_ID_COUNT}</small>
          {list.length > 3 ? (
            <small>
              还有 {list.length - 3} 个，
              <button className="domain-list-link" onClick={openRuleSettings}>在设置页管理</button>
            </small>
          ) : null}
        </div>
      </section>

      <section className="panel stats">
        <div className="section-head">
          <h2>今日浏览</h2>
          <div className="stats-head-actions">
            <span>{formatCompactDuration(todayBrowsingMs)}</span>
            <button onClick={openTodayStats}>时间统计</button>
          </div>
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
        {timeline.blocks.length > 0 ? (
          <div className="popup-timeline" aria-label="今日浏览时间线">
            <div className="timeline-axis">
              <span>{formatClock(timeline.startedAt)}</span>
              <span>{formatClock(timeline.endedAt)}</span>
            </div>
            <div className="timeline-track">
              {timeline.blocks.map((block) => (
                <button
                  type="button"
                  aria-label={block.tooltip}
                  data-tooltip={block.tooltip}
                  data-tooltip-align={block.tooltipAlign}
                  title={block.tooltip}
                  key={block.id}
                  className={`timeline-block ${block.kind === "idle" ? "idle" : ""}`}
                  style={{
                    left: `${block.leftPct}%`,
                    width: `${block.widthPct}%`,
                    background: block.color
                  }}
                />
              ))}
            </div>
            <div className="timeline-legend">
              {timeline.legend.slice(0, 4).map((item) => (
                <span key={item.domain}>
                  <i style={{ background: item.color }} />
                  {item.domain}
                </span>
              ))}
              {timeline.hasOther ? (
                <span>
                  <i style={{ background: OTHER_TIMELINE_COLOR }} />
                  其他
                </span>
              ) : null}
              {timeline.hasIdle ? (
                <span>
                  <i className="idle" style={{ background: IDLE_TIMELINE_COLOR }} />
                  未统计
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <button className="options" onClick={openRuleSettings}>
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
