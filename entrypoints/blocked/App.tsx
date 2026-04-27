import { useEffect, useMemo, useState } from "react";
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
  const quote = useMemo(() => getRandomQuote(), []);
  const blockedUrl = useMemo(() => getBlockedUrl(), []);

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
