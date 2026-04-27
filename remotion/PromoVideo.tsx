import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import type { CSSProperties, ReactNode } from "react";

const ink = "#181713";
const paper = "#f6f1e7";
const cream = "#fffaf0";
const clay = "#d95a2b";
const muted = "#6e6354";

export function PromoVideo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={styles.stage}>
      <Grid />
      <Sequence from={0} durationInFrames={7 * fps} premountFor={fps}>
        <Opening />
      </Sequence>
      <Sequence from={6 * fps} durationInFrames={7 * fps} premountFor={fps}>
        <BlockScene />
      </Sequence>
      <Sequence from={12 * fps} durationInFrames={7 * fps} premountFor={fps}>
        <StatsScene />
      </Sequence>
      <Sequence from={18 * fps} durationInFrames={6 * fps} premountFor={fps}>
        <PrivacyScene />
      </Sequence>
      <FrameCounter frame={frame} />
    </AbsoluteFill>
  );
}

function Opening() {
  return (
    <Scene>
      <Copy eyebrow="01Kit for Chrome" title="让浏览器少一点打扰" body="开启一段专注时间，把容易分心的网站挡在外面。" />
      <BrowserMock mode="focus" />
    </Scene>
  );
}

function BlockScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slide = interpolate(frame, [0, 1.2 * fps], [120, 0], clamp);
  const fade = interpolate(frame, [0, 0.8 * fps], [0, 1], clamp);

  return (
    <Scene>
      <div style={{ ...styles.domainWall, opacity: fade, transform: `translateX(${slide}px)` }}>
        {["youtube.com", "x.com", "bilibili.com", "reddit.com"].map((domain, index) => (
          <div key={domain} style={{ ...styles.domainCard, transform: `translateY(${Math.sin((frame + index * 18) / 16) * 8}px)` }}>
            <span>{domain}</span>
            <strong>已屏蔽</strong>
          </div>
        ))}
      </div>
      <Copy eyebrow="网站屏蔽" title="黑名单挡干扰，白名单留工作" body="访问被屏蔽网站时，直接回到插件内置的提醒页。" />
    </Scene>
  );
}

function StatsScene() {
  return (
    <Scene>
      <Copy eyebrow="时间统计" title="看清时间花在哪里" body="按域名查看今日、本周、本月的访问时间，窗口失焦和离开状态不计入。" />
      <StatsBoard />
    </Scene>
  );
}

function PrivacyScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seal = spring({ frame: frame - 0.6 * fps, fps, config: { damping: 200 } });

  return (
    <Scene>
      <div style={styles.privacyPanel}>
        <div style={{ ...styles.seal, transform: `scale(${interpolate(seal, [0, 1], [0.72, 1])})` }}>本地</div>
        <h2 style={styles.privacyTitle}>不上传浏览记录</h2>
        <p style={styles.privacyText}>黑名单、白名单、专注记录和统计数据都保存在你的浏览器里。</p>
      </div>
      <div style={styles.outro}>
        <span>01Kit</span>
        <strong>少一点切换，多一点完成</strong>
      </div>
    </Scene>
  );
}

function BrowserMock({ mode }: { mode: "focus" }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({ frame, fps, config: { damping: 200 } });
  const progress = interpolate(frame, [0.8 * fps, 5.2 * fps], [0.18, 0.68], clamp);

  return (
    <div style={{ ...styles.browser, transform: `translateY(${interpolate(entrance, [0, 1], [80, 0])}px)` }}>
      <div style={styles.browserBar}>
        <i style={styles.dot} />
        <i style={styles.dot} />
        <i style={styles.dot} />
        <span>01Kit</span>
      </div>
      <div style={styles.popup}>
        <div style={styles.popupHead}>
          <span>{mode === "focus" ? "专注中" : "准备开始"}</span>
          <strong>18:42</strong>
        </div>
        <div style={styles.timer}>25m</div>
        <div style={styles.progress}>
          <b style={{ ...styles.progressFill, width: `${progress * 100}%` }} />
        </div>
        <div style={styles.buttons}>
          <span>暂停 5 分钟</span>
          <span>结束专注</span>
        </div>
        <ul style={styles.list}>
          <li style={styles.listRow}><span>youtube.com</span><b>屏蔽</b></li>
          <li style={styles.listRow}><span>x.com</span><b>屏蔽</b></li>
          <li style={styles.listRow}><span>docs.google.com</span><b>允许</b></li>
        </ul>
      </div>
    </div>
  );
}

function StatsBoard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = [
    ["github.com", 0.92, "46m"],
    ["docs.google.com", 0.68, "34m"],
    ["youtube.com", 0.28, "14m"]
  ];

  return (
    <div style={styles.statsBoard}>
      <div style={styles.statsHead}>
        <span>今日</span>
        <strong>2 小时 18 分钟</strong>
      </div>
      {rows.map(([domain, width, time], index) => {
        const grow = interpolate(frame, [index * 8, 1.2 * fps + index * 8], [0.04, Number(width)], clamp);
        return (
          <div key={domain} style={styles.statRow}>
            <span>{domain}</span>
            <div style={styles.statBar}><b style={{ ...styles.statFill, width: `${grow * 100}%` }} /></div>
            <strong>{time}</strong>
          </div>
        );
      })}
    </div>
  );
}

function Copy({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 0.8 * fps], [0, 1], clamp);
  const y = interpolate(frame, [0, 0.8 * fps], [36, 0], {
    ...clamp,
    easing: Easing.out(Easing.cubic)
  });

  return (
    <div style={{ ...styles.copy, opacity, transform: `translateY(${y}px)` }}>
      <p style={styles.eyebrow}>{eyebrow}</p>
      <h1 style={styles.title}>{title}</h1>
      <p style={styles.body}>{body}</p>
    </div>
  );
}

function Scene({ children }: { children: ReactNode }) {
  return <AbsoluteFill style={styles.scene}>{children}</AbsoluteFill>;
}

function Grid() {
  return <AbsoluteFill style={styles.grid} />;
}

function FrameCounter({ frame }: { frame: number }) {
  const opacity = interpolate(frame, [660, 710], [0, 1], clamp);
  return <div style={{ ...styles.footerMark, opacity }}>01kit-chrome.01mvp.com</div>;
}

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const
};

const styles: Record<string, CSSProperties> = {
  stage: {
    backgroundColor: paper,
    color: ink,
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
    overflow: "hidden"
  },
  grid: {
    backgroundImage: `linear-gradient(90deg, rgba(24, 23, 19, 0.055) 1px, transparent 1px), linear-gradient(180deg, rgba(24, 23, 19, 0.055) 1px, transparent 1px)`,
    backgroundSize: "72px 72px"
  },
  scene: {
    display: "grid",
    gridTemplateColumns: "0.96fr 1fr",
    alignItems: "center",
    gap: 96,
    padding: "116px 136px"
  },
  copy: {
    display: "grid",
    gap: 28,
    maxWidth: 720
  },
  eyebrow: {
    margin: 0,
    color: "#8a3f1f",
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: 0
  },
  title: {
    margin: 0,
    fontSize: 110,
    lineHeight: 0.98,
    letterSpacing: 0,
    maxWidth: 760
  },
  body: {
    margin: 0,
    color: "#4b453a",
    fontSize: 36,
    lineHeight: 1.45,
    maxWidth: 690
  },
  browser: {
    justifySelf: "end",
    width: 690,
    minHeight: 760,
    border: `3px solid ${ink}`,
    borderRadius: 36,
    overflow: "hidden",
    backgroundColor: "#e9ddca",
    boxShadow: `30px 30px 0 ${ink}`
  },
  browserBar: {
    height: 82,
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "0 28px",
    borderBottom: `3px solid ${ink}`,
    backgroundColor: "#f7f3ea",
    fontSize: 24,
    fontWeight: 900
  },
  dot: {
    width: 16,
    height: 16,
    display: "block",
    border: `2px solid ${ink}`,
    borderRadius: "50%"
  },
  popup: {
    width: 520,
    margin: "68px auto",
    display: "grid",
    gap: 26,
    border: `3px solid ${ink}`,
    borderRadius: 28,
    padding: 34,
    backgroundColor: cream
  },
  popupHead: {
    display: "flex",
    justifyContent: "space-between",
    color: muted,
    fontSize: 24,
    fontWeight: 800
  },
  timer: {
    fontSize: 126,
    lineHeight: 1,
    fontWeight: 950
  },
  progress: {
    height: 16,
    border: `2px solid ${ink}`,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#ece2d3"
  },
  progressFill: {
    display: "block",
    height: "100%",
    backgroundColor: clay
  },
  buttons: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    fontSize: 20,
    fontWeight: 900
  },
  list: {
    display: "grid",
    gap: 16,
    margin: 0,
    padding: 0,
    listStyle: "none",
    fontSize: 24
  },
  listRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20
  },
  domainWall: {
    display: "grid",
    gap: 22
  },
  domainCard: {
    width: 620,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: `3px solid ${ink}`,
    backgroundColor: cream,
    padding: "28px 34px",
    fontSize: 34,
    fontWeight: 900
  },
  statsBoard: {
    justifySelf: "end",
    width: 760,
    display: "grid",
    gap: 30,
    border: `3px solid ${ink}`,
    backgroundColor: cream,
    boxShadow: `26px 26px 0 ${ink}`,
    padding: 46
  },
  statsHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    fontSize: 30,
    color: muted
  },
  statRow: {
    display: "grid",
    gridTemplateColumns: "250px 1fr 120px",
    gap: 22,
    alignItems: "center",
    fontSize: 27,
    fontWeight: 900
  },
  statBar: {
    height: 18,
    border: `2px solid ${ink}`,
    backgroundColor: "#ece2d3"
  },
  statFill: {
    display: "block",
    height: "100%",
    backgroundColor: clay
  },
  privacyPanel: {
    width: 680,
    display: "grid",
    gap: 30,
    border: `3px solid ${ink}`,
    backgroundColor: cream,
    padding: 52,
    boxShadow: `24px 24px 0 ${ink}`
  },
  seal: {
    width: 150,
    height: 150,
    display: "grid",
    placeItems: "center",
    border: `3px solid ${ink}`,
    borderRadius: "50%",
    backgroundColor: clay,
    color: cream,
    fontSize: 40,
    fontWeight: 950
  },
  privacyTitle: {
    margin: 0,
    fontSize: 72,
    lineHeight: 1.08
  },
  privacyText: {
    margin: 0,
    color: "#4b453a",
    fontSize: 34,
    lineHeight: 1.5
  },
  outro: {
    alignSelf: "end",
    justifySelf: "end",
    display: "grid",
    gap: 14,
    textAlign: "right",
    fontSize: 34
  },
  footerMark: {
    position: "absolute",
    right: 80,
    bottom: 54,
    fontSize: 28,
    fontWeight: 900,
    color: "#8a3f1f"
  }
};
