import { useEffect, useMemo, useState } from "react";
import { domainFromUrl } from "../../src/lib/domain";
import { getFocusStatus, getRandomQuote, pauseFocusSession } from "../../src/lib/focus";
import { formatDuration } from "../../src/lib/time";
import type { FocusStatus } from "../../src/lib/types";

const pauseOptions = [
  { minutes: 1, label: "1 分钟", hint: "只确认一件事" },
  { minutes: 5, label: "5 分钟", hint: "处理必要内容" },
  { minutes: 15, label: "15 分钟", hint: "留给真正急的事" }
];

function getBlockedUrl(): string | null {
  const rawUrl = window.location.hash.slice(1);
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function getBlockReason(): "focus" | "global" {
  const reason = new URLSearchParams(window.location.search).get("reason");
  return reason === "global" ? "global" : "focus";
}

async function closeCurrentTab() {
  if (typeof chrome !== "undefined" && chrome.tabs?.getCurrent && chrome.tabs?.remove) {
    try {
      const tab = await chrome.tabs.getCurrent();
      if (tab?.id) {
        await chrome.tabs.remove(tab.id);
        return;
      }
    } catch {}
  }

  window.close();
}

async function leaveBlockedPage() {
  if (history.length > 1) {
    history.back();
    return;
  }

  await closeCurrentTab();
}

export default function App() {
  const [status, setStatus] = useState<FocusStatus | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const quote = useMemo(() => getRandomQuote(), []);
  const blockedUrl = useMemo(() => getBlockedUrl(), []);
  const blockReason = useMemo(() => getBlockReason(), []);
  const blockedDomain = useMemo(() => domainFromUrl(blockedUrl ?? undefined), [blockedUrl]);

  async function reload() {
    setStatus(await getFocusStatus());
  }

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  async function pauseAndOpen(minutes: number) {
    await pauseFocusSession(minutes);

    if (blockedUrl) {
      window.location.replace(blockedUrl);
      return;
    }

    await leaveBlockedPage();
  }

  async function openGlobalBlockedUrl() {
    if (!blockedUrl) {
      await leaveBlockedPage();
      return;
    }

    setOpening(true);
    setError("");
    try {
      const response = await chrome.runtime.sendMessage({
        type: "ALLOW_GLOBAL_BLACKLIST_URL_ONCE",
        url: blockedUrl
      });

      if (!response?.ok) {
        setError("这次没有打开成功，可以回到上一页后再试一次。");
        setOpening(false);
        return;
      }

      window.location.replace(blockedUrl);
    } catch {
      setError("这次没有打开成功，可以回到上一页后再试一次。");
      setOpening(false);
    }
  }

  if (blockReason === "global") {
    return (
      <main className="blocked global-blocked">
        <section className="focus-copy">
          <p className="eyebrow">01Kit · 全局黑名单</p>
          <h1>停一下</h1>
          <p className="quote">
            {blockedDomain ? `${blockedDomain} 在全局黑名单里。` : "这个网站在全局黑名单里。"}
            先停一下，确认它现在确实值得占用注意力。
          </p>
        </section>

        <section className="focus-panel" aria-label="全局黑名单确认">
          <div className="time-block">
            <span>即将打开</span>
            <strong className="blocked-domain">{blockedDomain ?? "未知网站"}</strong>
          </div>

          <div className="actions">
            <button className="back-button" onClick={() => void leaveBlockedPage()}>离开这个页面</button>
            <div className="confirm-group">
              <p>如果只是顺手点开，先回去。确实需要打开时，再确认一次。</p>
              {!confirming ? (
                <button className="confirm-button" onClick={() => setConfirming(true)}>
                  我确实要打开
                </button>
              ) : (
                <button className="confirm-button danger" disabled={opening} onClick={() => void openGlobalBlockedUrl()}>
                  {opening ? "正在打开" : "确认打开"}
                </button>
              )}
              {error ? <p className="error-text">{error}</p> : null}
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!status?.session) {
    return (
      <main className="blocked ended">
        <section className="focus-copy">
          <p className="eyebrow">01Kit</p>
          <h1>专注已结束</h1>
          <p className="quote">可以回到刚才的页面，也可以开始下一段专注。</p>
        </section>
        <button className="back-button" onClick={() => void leaveBlockedPage()}>离开这个页面</button>
      </main>
    );
  }

  return (
    <main className="blocked">
      <section className="focus-copy">
        <p className="eyebrow">01Kit · 专注中</p>
        <h1>先回到正在做的事</h1>
        <p className="quote">{quote}</p>
      </section>

      <section className="focus-panel" aria-label="当前专注状态">
        <div className="time-block">
          <span>剩余专注时间</span>
          <strong className="time">{formatDuration(status.remainingMs)}</strong>
        </div>

        <div className="actions">
          <button className="back-button" onClick={() => void leaveBlockedPage()}>离开这个页面</button>
          <div className="pause-group">
            <p>确实需要打开时，给自己一个短窗口。</p>
            <div className="pause-options">
              {pauseOptions.map((option) => (
                <button
                  aria-label={`放行 ${option.label}，${option.hint}`}
                  className="pause-button"
                  key={option.minutes}
                  onClick={() => pauseAndOpen(option.minutes)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
