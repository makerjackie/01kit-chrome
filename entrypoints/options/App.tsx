import { useEffect, useMemo, useRef, useState } from "react";
import {
  AUTHOR_EMAIL,
  EXTENSION_TUTORIAL_URL,
  FEEDBACK_URL,
  REPOSITORY_URL,
  RULE_ID_COUNT
} from "../../src/lib/constants";
import { normalizeDomain } from "../../src/lib/domain";
import { domainStatsToCsv, downloadText, statsToJson } from "../../src/lib/export";
import { openExternalUrl } from "../../src/lib/links";
import { getFocusRecords, getSettings, getTimeStats, saveSettings, clearTimeStats, restoreDataBackup, getTrackerState } from "../../src/lib/storage";
import { autoCategory, focusMsForDay, getDomainStats } from "../../src/lib/stats";
import { getAllTimelineSegments, getTimelineSegmentsForDay } from "../../src/lib/timeline-db";
import { buildTimelineView, formatClock, IDLE_TIMELINE_COLOR, OTHER_TIMELINE_COLOR, withActiveTimelineSegment } from "../../src/lib/timeline-view";
import { dateKey, formatCompactDuration, rangeKeys } from "../../src/lib/time";
import type { DomainStat, FocusRecord, FocusSettings, SiteCategory, StatsRange, TimeSegment, TimeStats } from "../../src/lib/types";

const categories: { value: SiteCategory; label: string }[] = [
  { value: "work", label: "工作" },
  { value: "learn", label: "学习" },
  { value: "social", label: "社交" },
  { value: "entertainment", label: "娱乐" },
  { value: "video", label: "视频" },
  { value: "news", label: "资讯" },
  { value: "shopping", label: "购物" },
  { value: "other", label: "其他" }
];

const supportLinks = [
  { label: "问题反馈", url: FEEDBACK_URL },
  { label: "GitHub", url: REPOSITORY_URL },
  { label: "使用说明", url: EXTENSION_TUTORIAL_URL }
];

const MIN_TIMELINE_ZOOM = 1;
const MAX_TIMELINE_ZOOM = 8;

export default function App() {
  const [settings, setSettings] = useState<FocusSettings | null>(null);
  const [stats, setStats] = useState<TimeStats>({ days: {} });
  const [records, setRecords] = useState<FocusRecord[]>([]);
  const [timelineSegments, setTimelineSegments] = useState<TimeSegment[]>([]);
  const [range, setRange] = useState<StatsRange>("today");
  const [globalInput, setGlobalInput] = useState("");
  const [blackInput, setBlackInput] = useState("");
  const [whiteInput, setWhiteInput] = useState("");
  const [showAllStats, setShowAllStats] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showTimelineHelp, setShowTimelineHelp] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [importMessage, setImportMessage] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);

  async function reload() {
    const now = Date.now();
    const [nextSettings, nextStats, nextRecords, nextTimelineSegments, trackerState] = await Promise.all([
      getSettings(),
      getTimeStats(),
      getFocusRecords(),
      getTimelineSegmentsForDay(),
      getTrackerState()
    ]);
    setSettings(nextSettings);
    setStats(nextStats);
    setRecords(nextRecords.reverse());
    setTimelineSegments(withActiveTimelineSegment(nextTimelineSegments, trackerState, now));
  }

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), 5_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setShowAllStats(false);
  }, [range]);

  useEffect(() => {
    if (!settings || !window.location.hash) return;

    const animationFrame = window.requestAnimationFrame(() => {
      document.querySelector(window.location.hash)?.scrollIntoView({ block: "start" });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [settings]);

  const storedRows = useMemo<DomainStat[]>(() => {
    if (!settings) return [];
    return getDomainStats(stats, settings, range);
  }, [settings, stats, range]);
  const storedTodayRows = useMemo<DomainStat[]>(() => {
    if (!settings) return [];
    return getDomainStats(stats, settings, "today");
  }, [settings, stats]);
  const todayFocusMs = focusMsForDay(records, dateKey());
  const goalMs = (settings?.dailyFocusGoalMinutes ?? 120) * 60_000;
  const timeline = useMemo(() => buildTimelineView(timelineSegments), [timelineSegments]);
  const timelineRows = useMemo<DomainStat[]>(() => {
    if (!settings) return [];
    const totals = new Map<string, number>();
    for (const block of timeline.blocks) {
      if (block.kind !== "site") continue;
      totals.set(block.domain, (totals.get(block.domain) ?? 0) + block.ms);
    }
    return Array.from(totals.entries())
      .map(([domain, ms]) => ({
        domain,
        ms,
        category: settings.categories[domain] ?? autoCategory(domain)
      }))
      .sort((a, b) => b.ms - a.ms);
  }, [settings, timeline]);
  const todayRows = useMemo<DomainStat[]>(() => {
    const byDomain = new Map<string, DomainStat>();
    for (const row of storedTodayRows) byDomain.set(row.domain, row);
    for (const row of timelineRows) {
      const storedRow = byDomain.get(row.domain);
      if (!storedRow || row.ms > storedRow.ms) byDomain.set(row.domain, row);
    }
    return Array.from(byDomain.values()).sort((a, b) => b.ms - a.ms);
  }, [storedTodayRows, timelineRows]);
  const rows = range === "today" ? todayRows : storedRows;
  const maxMs = rows[0]?.ms ?? 1;
  const visibleRows = showAllStats ? rows : rows.slice(0, 10);
  const todayBrowsingMs = todayRows.reduce((total, row) => total + row.ms, 0);
  const rangeBrowsingMs = rows.reduce((total, row) => total + row.ms, 0);
  const categoryRows = useMemo(() => {
    const totals = new Map<SiteCategory, number>();
    for (const row of rows) totals.set(row.category, (totals.get(row.category) ?? 0) + row.ms);
    return categories
      .map((category) => ({
        ...category,
        ms: totals.get(category.value) ?? 0
      }))
      .filter((category) => category.ms > 0)
      .sort((a, b) => b.ms - a.ms);
  }, [rows]);
  const todayCategoryRows = useMemo(() => {
    const totals = new Map<SiteCategory, number>();
    for (const row of todayRows) totals.set(row.category, (totals.get(row.category) ?? 0) + row.ms);
    return categories
      .map((category) => ({
        ...category,
        ms: totals.get(category.value) ?? 0
      }))
      .filter((category) => category.ms > 0)
      .sort((a, b) => b.ms - a.ms);
  }, [todayRows]);

  async function patchSettings(patch: Partial<FocusSettings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveSettings(next);
  }

  async function addDomain(kind: "globalBlacklist" | "blacklist" | "whitelist", raw: string) {
    if (!settings) return;
    const domain = normalizeDomain(raw);
    if (!domain) return;
    if (!settings[kind].includes(domain) && settings[kind].length >= RULE_ID_COUNT) return;
    await patchSettings({
      [kind]: Array.from(new Set([...settings[kind], domain])).sort()
    } as Partial<FocusSettings>);
    setGlobalInput("");
    setBlackInput("");
    setWhiteInput("");
  }

  async function removeDomain(kind: "globalBlacklist" | "blacklist" | "whitelist", domain: string) {
    if (!settings) return;
    await patchSettings({
      [kind]: settings[kind].filter((item) => item !== domain)
    } as Partial<FocusSettings>);
  }

  async function updateCategory(domain: string, category: SiteCategory) {
    if (!settings) return;
    await patchSettings({
      categories: { ...settings.categories, [domain]: category }
    });
  }

  function exportCsv() {
    downloadText(`01kit-${range}.csv`, domainStatsToCsv(rows), "text/csv;charset=utf-8");
  }

  async function exportJson() {
    const allTimelineSegments = await getAllTimelineSegments();
    downloadText("01kit-data.json", statsToJson(stats, records, settings ?? undefined, allTimelineSegments), "application/json;charset=utf-8");
  }

  async function importJson(file: File | undefined) {
    if (!file) return;
    setImportMessage("");
    try {
      const content = await file.text();
      const result = await restoreDataBackup(JSON.parse(content));
      await reload();
      setImportMessage(`已合并 ${result.dayCount} 天统计、${result.recordCount} 条专注记录和 ${result.segmentCount} 条时间线。`);
    } catch {
      setImportMessage("导入失败，请选择从 01Kit 导出的 JSON 文件。");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  async function clearHistory() {
    if (!window.confirm("清除时间统计和专注记录？")) return;
    await clearTimeStats();
    await reload();
  }

  function zoomTimeline(event: React.WheelEvent<HTMLDivElement>) {
    const scrollElement = timelineScrollRef.current;
    if (!scrollElement) return;

    event.preventDefault();
    const rect = scrollElement.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const scrollRatio = (scrollElement.scrollLeft + pointerX) / Math.max(scrollElement.scrollWidth, 1);
    const zoomStep = event.deltaY < 0 ? 1.16 : 1 / 1.16;

    setTimelineZoom((currentZoom) => {
      const nextZoom = Math.min(MAX_TIMELINE_ZOOM, Math.max(MIN_TIMELINE_ZOOM, currentZoom * zoomStep));
      window.requestAnimationFrame(() => {
        const nextScrollLeft = scrollElement.scrollWidth * scrollRatio - pointerX;
        scrollElement.scrollLeft = Math.max(0, nextScrollLeft);
      });
      return nextZoom;
    });
  }

  if (!settings) {
    return <main className="shell loading">加载中</main>;
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p>01Kit</p>
          <h1>设置与统计</h1>
        </div>
        <div className="goal-box">
          <span>今日专注</span>
          <strong>{formatCompactDuration(todayFocusMs)}</strong>
          <small>目标 {formatCompactDuration(goalMs)}</small>
        </div>
      </header>

      <div className="settings-layout">
        <aside className="side-nav" aria-label="设置导航">
          <a href="#focus-settings">专注设置</a>
          <a href="#global-blacklist">全局黑名单</a>
          <a href="#blacklist">黑名单</a>
          <a href="#whitelist">白名单</a>
          <a href="#time-stats">时间统计</a>
          <a href="#focus-records">专注记录</a>
          <a href="#week-view">最近 7 天</a>
          <a href="#help">帮助</a>
        </aside>

        <div className="content-stack">
          <section className="panel" id="focus-settings">
            <div className="panel-head">
              <h2>专注设置</h2>
              <div className="segmented">
                <button className={settings.blockMode === "blacklist" ? "active" : ""} onClick={() => patchSettings({ blockMode: "blacklist" })}>
                  黑名单
                </button>
                <button className={settings.blockMode === "whitelist" ? "active" : ""} onClick={() => patchSettings({ blockMode: "whitelist" })}>
                  白名单
                </button>
              </div>
            </div>
            <div className="form-grid">
              <label>
                默认专注分钟
                <input
                  min={1}
                  max={240}
                  type="number"
                  value={settings.defaultFocusMinutes}
                  onChange={(event) => patchSettings({ defaultFocusMinutes: Number(event.target.value) })}
                />
              </label>
              <label>
                每日目标分钟
                <input
                  min={0}
                  type="number"
                  value={settings.dailyFocusGoalMinutes}
                  onChange={(event) => patchSettings({ dailyFocusGoalMinutes: Number(event.target.value) })}
                />
              </label>
            </div>
            <p className="note">快捷键：Alt + Shift + F 开始默认专注，Alt + Shift + P 暂停 5 分钟。</p>
          </section>

          <section className="panel" id="global-blacklist">
            <div className="panel-head">
              <div>
                <h2>全局黑名单</h2>
                <p className="panel-subtitle">全局黑名单，无论专注模式开启与否，都会尝试拦截。</p>
              </div>
            </div>
            <DomainEditor
              domains={settings.globalBlacklist}
              input={globalInput}
              onInput={setGlobalInput}
              limit={RULE_ID_COUNT}
              onAdd={() => addDomain("globalBlacklist", globalInput)}
              onRemove={(domain) => removeDomain("globalBlacklist", domain)}
            />
          </section>

          <section className="panel" id="blacklist">
            <div className="panel-head">
              <div>
                <h2>专注黑名单</h2>
                <p className="panel-subtitle">只在黑名单专注模式开启时拦截。</p>
              </div>
            </div>
            <DomainEditor
              domains={settings.blacklist}
              input={blackInput}
              onInput={setBlackInput}
              limit={RULE_ID_COUNT}
              onAdd={() => addDomain("blacklist", blackInput)}
              onRemove={(domain) => removeDomain("blacklist", domain)}
            />
          </section>

          <section className="panel" id="whitelist">
            <div className="panel-head">
              <div>
                <h2>专注白名单</h2>
                <p className="panel-subtitle">只在白名单专注模式开启时生效。</p>
              </div>
            </div>
            <DomainEditor
              domains={settings.whitelist}
              input={whiteInput}
              onInput={setWhiteInput}
              limit={RULE_ID_COUNT}
              onAdd={() => addDomain("whitelist", whiteInput)}
              onRemove={(domain) => removeDomain("whitelist", domain)}
            />
          </section>

          <section className="panel stats-panel" id="time-stats">
            <div className="panel-head">
              <div>
                <h2>时间统计</h2>
                <p className="panel-subtitle">查看今天的浏览时间、网站分类和网站排行。卸载插件会清掉本地统计，重装前可以先导出 JSON。</p>
              </div>
              <div className="toolbar">
                <button onClick={exportCsv}>导出 CSV</button>
                <button onClick={() => void exportJson()}>导出 JSON</button>
                <button onClick={() => importInputRef.current?.click()}>导入 JSON</button>
                <button onClick={clearHistory}>清除</button>
              </div>
            </div>
            <input
              ref={importInputRef}
              className="file-input"
              type="file"
              accept="application/json,.json"
              onChange={(event) => void importJson(event.target.files?.[0])}
            />
            {importMessage ? <p className="note">{importMessage}</p> : null}

            <div className="stats-overview" aria-label="今日浏览统计总览">
              <div>
                <span>今日总浏览</span>
                <strong>{formatCompactDuration(todayBrowsingMs)}</strong>
              </div>
              <div>
                <span>访问网站</span>
                <strong>{todayRows.length}</strong>
              </div>
              <div>
                <span>主要分类</span>
                <strong>{todayCategoryRows[0]?.label ?? "暂无"}</strong>
              </div>
            </div>

            <div className="stats-section" id="today-timeline">
              <div className="subsection-head">
                <div>
                  <div className="title-row">
                    <h3>今日时间线</h3>
                    <button
                      aria-controls="timeline-help"
                      aria-expanded={showTimelineHelp}
                      aria-label="查看时间线统计说明"
                      className="icon-help"
                      onClick={() => setShowTimelineHelp((value) => !value)}
                      type="button"
                    >
                      ?
                    </button>
                  </div>
                  <p className="panel-subtitle">按时间顺序看今天打开过的网站。灰色斜纹表示没有计入的时间。</p>
                </div>
              </div>
              {showTimelineHelp ? (
                <div className="timeline-help" id="timeline-help">
                  <strong>时间线怎么统计</strong>
                  <p>只记录你正在使用的 Chrome 窗口和当前网页。</p>
                  <p>切到其他 App、系统进入空闲状态，或当前页不是普通网页时，这段时间会显示为“未统计”。</p>
                  <p>同一网站连续访问会合并显示，当前正在浏览的网站会自动补到时间线末尾。</p>
                </div>
              ) : null}
              {timeline.blocks.length > 0 ? (
                <>
                  <div ref={timelineScrollRef} className="timeline-scroll" aria-label="今日浏览时间线" onWheel={zoomTimeline}>
                    <div className="timeline-canvas" style={{ width: `${timelineZoom * 100}%` }}>
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
                    </div>
                  </div>
                  <div className="timeline-legend">
                    {timeline.legend.map((item) => (
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
                </>
              ) : (
                <p className="note">今天还没有时间线明细。继续浏览同一个网站超过 1 分钟后，这里会开始显示。</p>
              )}
            </div>

            <div className="stats-section">
              <div className="subsection-head">
                <div>
                  <h3>今日分类</h3>
                  <p className="panel-subtitle">看看今天主要花在哪类网站上。</p>
                </div>
              </div>
              {todayCategoryRows.length > 0 ? (
                <div className="category-bars" aria-label="今日分类时间分布">
                  {todayCategoryRows.map((category) => (
                    <div key={category.value}>
                      <span>{category.label}</span>
                      <div className="bar">
                        <span style={{ width: `${Math.max(4, (category.ms / Math.max(todayBrowsingMs, 1)) * 100)}%` }} />
                      </div>
                      <b>{formatCompactDuration(category.ms)}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="note">今天还没有可展示的分类统计。</p>
              )}
            </div>

            <div className="stats-section">
              <div className="subsection-head">
                <div>
                  <h3>网站排行</h3>
                  <p className="panel-subtitle">按网站查看访问时间，可以切换今日、本周和本月。</p>
                </div>
                <div className="toolbar">
                  {(["today", "week", "month"] as StatsRange[]).map((item) => (
                    <button className={range === item ? "active" : ""} key={item} onClick={() => setRange(item)}>
                      {item === "today" ? "今日" : item === "week" ? "本周" : "本月"}
                    </button>
                  ))}
                </div>
              </div>
              {range !== "today" ? (
                <div className="stats-summary">
                  <div>
                    <span>{range === "week" ? "本周总浏览" : "本月总浏览"}</span>
                    <strong>{formatCompactDuration(rangeBrowsingMs)}</strong>
                  </div>
                  <div>
                    <span>网站数量</span>
                    <strong>{rows.length}</strong>
                  </div>
                  <div>
                    <span>主要分类</span>
                    <strong>{categoryRows[0]?.label ?? "暂无"}</strong>
                  </div>
                </div>
              ) : null}
              <div className="stats-table">
                {visibleRows.map((row) => (
                  <div className="stat-row" key={row.domain}>
                    <div>
                      <strong>{row.domain}</strong>
                      <select value={settings.categories[row.domain] ?? row.category} onChange={(event) => updateCategory(row.domain, event.target.value as SiteCategory)}>
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="bar">
                      <span style={{ width: `${Math.max(4, (row.ms / maxMs) * 100)}%` }} />
                    </div>
                    <b>{formatCompactDuration(row.ms)}</b>
                  </div>
                ))}
                {rows.length === 0 ? <p className="note">还没有统计数据。</p> : null}
              </div>
              {rows.length > 10 ? (
                <button className="expand-button" onClick={() => setShowAllStats((value) => !value)}>
                  {showAllStats ? "收起到前 10 个" : `展开全部 ${rows.length} 个网站`}
                </button>
              ) : null}
            </div>
          </section>

          <section className="panel" id="focus-records">
            <div className="panel-head">
              <h2>专注记录</h2>
            </div>
            <div className="record-list">
              {records.slice(0, 8).map((record) => (
                <div key={record.id}>
                  <span>{new Date(record.startedAt).toLocaleString()}</span>
                  <strong>{formatCompactDuration(record.focusedMs)}</strong>
                  <small>{record.completed ? "完成" : "手动结束"} · {record.mode === "blacklist" ? "黑名单" : "白名单"}</small>
                </div>
              ))}
              {records.length === 0 ? <p className="note">还没有专注记录。</p> : null}
            </div>
          </section>

          <section className="panel" id="week-view">
            <div className="panel-head">
              <h2>最近 7 天</h2>
            </div>
            <div className="calendar">
              {rangeKeys("week").reverse().map((key) => {
                const ms = focusMsForDay(records, key);
                const pct = goalMs > 0 ? Math.min(100, (ms / goalMs) * 100) : 0;
                return (
                  <div key={key}>
                    <span>{key.slice(5)}</span>
                    <div><i style={{ height: `${Math.max(4, pct)}%` }} /></div>
                    <small>{Math.round(ms / 60000)}m</small>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel help-panel" id="help">
            <div className="panel-head">
              <div>
                <h2>帮助</h2>
                <p className="panel-subtitle">遇到问题可以提交反馈，也可以查看使用说明和源码。</p>
              </div>
            </div>
            <div className="help-actions">
              {supportLinks.map((item) => (
                <button key={item.label} onClick={() => openExternalUrl(item.url)}>
                  {item.label}
                </button>
              ))}
              <button onClick={() => setShowContact((value) => !value)}>
                联系作者
              </button>
            </div>
            {showContact ? (
              <div className="contact-card">
                <span>作者邮箱</span>
                <a href={`mailto:${AUTHOR_EMAIL}`}>{AUTHOR_EMAIL}</a>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function DomainEditor(props: {
  domains: string[];
  input: string;
  onInput: (value: string) => void;
  limit?: number;
  onAdd: () => void;
  onRemove: (domain: string) => void;
}) {
  const atLimit = props.limit ? props.domains.length >= props.limit : false;
  return (
    <div className="domain-editor">
      <div className="add-row">
        <input
          placeholder="example.com"
          value={props.input}
          onChange={(event) => props.onInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") props.onAdd();
          }}
        />
        <button disabled={atLimit} onClick={props.onAdd}>添加</button>
      </div>
      {props.limit ? <p className="note">{props.domains.length} / {props.limit}</p> : null}
      <div className="chips">
        {props.domains.map((domain) => (
          <span key={domain}>
            {domain}
            <button aria-label={`删除 ${domain}`} onClick={() => props.onRemove(domain)}>
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
