import { useEffect, useMemo, useState } from "react";
import { getFocusStatus, getRandomQuote, pauseFocusSession } from "../../src/lib/focus";
import { formatDuration } from "../../src/lib/time";
import type { FocusStatus } from "../../src/lib/types";

const pauseOptions = [1, 5, 15];

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

function leaveBlockedPage() {
  if (history.length > 1) {
    history.back();
    return;
  }

  window.close();
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

    leaveBlockedPage();
  }

  if (!status?.session) {
    return (
      <main className="blocked">
        <p className="eyebrow">01Kit</p>
        <h1>专注已结束</h1>
        <button onClick={leaveBlockedPage}>返回上一页</button>
      </main>
    );
  }

  return (
    <main className="blocked">
      <p className="eyebrow">01Kit</p>
      <h1>现在先不打开这个网站</h1>
      <div className="time">{formatDuration(status.remainingMs)}</div>
      <p>{quote}</p>
      <div className="actions">
        <button className="back-button" onClick={leaveBlockedPage}>返回上一页</button>
        {pauseOptions.map((minutes) => (
          <button className="pause-button" key={minutes} onClick={() => pauseAndOpen(minutes)}>
            临时打开 {minutes} 分钟
          </button>
        ))}
      </div>
    </main>
  );
}
