import { useEffect, useMemo, useState } from "react";
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
import { getFocusRecords, getSettings, getTimeStats, saveSettings, clearTimeStats } from "../../src/lib/storage";
import { focusMsForDay, getDomainStats } from "../../src/lib/stats";
import { dateKey, formatCompactDuration, rangeKeys } from "../../src/lib/time";
import type { DomainStat, FocusRecord, FocusSettings, SiteCategory, StatsRange, TimeStats } from "../../src/lib/types";

const categories: { value: SiteCategory; label: string }[] = [
  { value: "work", label: "工作" },
  { value: "learn", label: "学习" },
  { value: "social", label: "社交" },
  { value: "video", label: "视频" },
  { value: "news", label: "资讯" },
  { value: "shopping", label: "购物" },
  { value: "other", label: "其他" }
];

const supportLinks = [
  { label: "问题反馈", url: FEEDBACK_URL },
  { label: "GitHub", url: REPOSITORY_URL },
  { label: "插件教程", url: EXTENSION_TUTORIAL_URL }
];

export default function App() {
  const [settings, setSettings] = useState<FocusSettings | null>(null);
  const [stats, setStats] = useState<TimeStats>({ days: {} });
  const [records, setRecords] = useState<FocusRecord[]>([]);
  const [range, setRange] = useState<StatsRange>("today");
  const [blackInput, setBlackInput] = useState("");
  const [whiteInput, setWhiteInput] = useState("");
  const [exclusionInput, setExclusionInput] = useState("");
  const [showAllStats, setShowAllStats] = useState(false);
  const [showContact, setShowContact] = useState(false);

  async function reload() {
    const [nextSettings, nextStats, nextRecords] = await Promise.all([
      getSettings(),
      getTimeStats(),
      getFocusRecords()
    ]);
    setSettings(nextSettings);
    setStats(nextStats);
    setRecords(nextRecords.reverse());
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    setShowAllStats(false);
  }, [range]);

  const rows = useMemo<DomainStat[]>(() => {
    if (!settings) return [];
    return getDomainStats(stats, settings, range);
  }, [settings, stats, range]);

  const maxMs = rows[0]?.ms ?? 1;
  const visibleRows = showAllStats ? rows : rows.slice(0, 10);
  const todayFocusMs = focusMsForDay(records, dateKey());
  const goalMs = (settings?.dailyFocusGoalMinutes ?? 120) * 60_000;

  async function patchSettings(patch: Partial<FocusSettings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveSettings(next);
  }

  async function addDomain(kind: "blacklist" | "whitelist" | "trackingExclusions", raw: string) {
    if (!settings) return;
    const domain = normalizeDomain(raw);
    if (!domain) return;
    if (kind !== "trackingExclusions" && !settings[kind].includes(domain) && settings[kind].length >= RULE_ID_COUNT) return;
    await patchSettings({
      [kind]: Array.from(new Set([...settings[kind], domain])).sort()
    } as Partial<FocusSettings>);
    setBlackInput("");
    setWhiteInput("");
    setExclusionInput("");
  }

  async function removeDomain(kind: "blacklist" | "whitelist" | "trackingExclusions", domain: string) {
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

  function exportJson() {
    downloadText("01kit-data.json", statsToJson(stats, records), "application/json;charset=utf-8");
  }

  async function clearHistory() {
    if (!window.confirm("清除时间统计和专注记录？")) return;
    await clearTimeStats();
    await reload();
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
          <a href="#blacklist">黑名单</a>
          <a href="#whitelist">白名单</a>
          <a href="#privacy-exclusions">隐私排除</a>
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

          <section className="panel" id="blacklist">
            <div className="panel-head">
              <h2>黑名单</h2>
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
              <h2>白名单</h2>
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

          <section className="panel" id="privacy-exclusions">
            <div className="panel-head">
              <div>
                <h2>隐私排除</h2>
                <p className="panel-subtitle">这些网站不会进入时间统计，适合放账号、银行和本地开发地址。</p>
              </div>
            </div>
            <DomainEditor
              domains={settings.trackingExclusions}
              input={exclusionInput}
              onInput={setExclusionInput}
              onAdd={() => addDomain("trackingExclusions", exclusionInput)}
              onRemove={(domain) => removeDomain("trackingExclusions", domain)}
            />
          </section>

          <section className="panel" id="time-stats">
            <div className="panel-head">
              <div>
                <h2>时间统计</h2>
                <p className="panel-subtitle">默认显示访问时间最长的前 10 个网站。</p>
              </div>
              <div className="toolbar">
                {(["today", "week", "month"] as StatsRange[]).map((item) => (
                  <button className={range === item ? "active" : ""} key={item} onClick={() => setRange(item)}>
                    {item === "today" ? "今日" : item === "week" ? "本周" : "本月"}
                  </button>
                ))}
                <button onClick={exportCsv}>导出 CSV</button>
                <button onClick={exportJson}>导出 JSON</button>
                <button onClick={clearHistory}>清除</button>
              </div>
            </div>
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
                <p className="panel-subtitle">遇到问题可以提交反馈，也可以查看源码和插件教程。</p>
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
