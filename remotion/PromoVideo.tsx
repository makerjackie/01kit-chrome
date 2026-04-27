import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import type { CSSProperties, ReactNode } from "react";

export type Locale = "zh" | "en";
export type VideoProps = {
  locale: Locale;
};

export const motionDurationFrames = 720;
export const demoDurationFrames = 480;

const ink = "#181713";
const paper = "#f6f1e7";
const cream = "#fffaf0";
const clay = "#d95a2b";
const muted = "#6e6354";
const moss = "#2f6f55";
const sky = "#315f8f";

const script = {
  zh: {
    motion: {
      opening: ["01Kit for Chrome", "让浏览器\n少一点打扰", "开启一段专注时间，把容易分心的网站挡在外面。"],
      block: ["网站屏蔽", "黑名单挡干扰\n白名单留工作", "访问被屏蔽网站时，直接回到插件内置的提醒页。"],
      stats: ["时间统计", "看清时间\n花在哪里", "按域名查看今日、本周、本月的访问时间，窗口失焦和离开状态不计入。"],
      privacy: ["本地", "不上传浏览记录", "黑名单、白名单、专注记录和统计数据都保存在你的浏览器里。"],
      outro: ["01Kit", "少一点切换，多一点完成"],
      focusStatus: "专注中",
      pause: "暂停 5 分钟",
      end: "结束专注",
      blocked: "已屏蔽",
      allow: "允许",
      today: "今日",
      total: "2 小时 18 分钟"
    },
    demo: {
      steps: ["开始专注", "拦截干扰", "保留工作网站", "查看统计"],
      scenes: [
        ["打开 01Kit", "选择 25 分钟，点击开始，拦截规则立即生效。"],
        ["访问分心网站", "页面被挡下，提示你回到正在做的事。"],
        ["调整名单", "黑名单挡住干扰源，白名单保留必要工具。"],
        ["复盘时间", "按域名查看今天的浏览时间，数据只留在本地。"]
      ],
      start: "开始专注",
      blocklist: "黑名单",
      allowlist: "白名单",
      blockedTitle: "回到专注",
      blockedBody: "youtube.com 已在本次专注中屏蔽",
      review: "今日复盘",
      local: "本地保存"
    }
  },
  en: {
    motion: {
      opening: ["01Kit for Chrome", "Less distraction in your browser", "Start a focus block and keep tempting sites out of reach."],
      block: ["Site blocking", "Block distractions, keep work open", "Blocked sites send you back to a quiet reminder page."],
      stats: ["Time stats", "See where the time went", "Review browser time by domain across today, this week, and this month."],
      privacy: ["Local", "Browsing records stay private", "Blocklists, allowlists, focus sessions, and stats stay in your browser."],
      outro: ["01Kit", "Switch less. Finish more."],
      focusStatus: "Focus running",
      pause: "Pause 5 min",
      end: "End focus",
      blocked: "Blocked",
      allow: "Allowed",
      today: "Today",
      total: "2h 18m"
    },
    demo: {
      steps: ["Start focus", "Block detours", "Keep work open", "Review stats"],
      scenes: [
        ["Open 01Kit", "Pick 25 minutes and start. Blocking rules turn on right away."],
        ["Visit a distracting site", "The page is blocked and points you back to the task."],
        ["Adjust your lists", "Block distracting sites while keeping essential work tools available."],
        ["Review your time", "Check today's browser time by domain. The data stays local."]
      ],
      start: "Start focus",
      blocklist: "Blocklist",
      allowlist: "Allowlist",
      blockedTitle: "Back to focus",
      blockedBody: "youtube.com is blocked during this focus session",
      review: "Today",
      local: "Stored locally"
    }
  }
} as const;

export function PromoVideo({ locale = "zh" }: VideoProps) {
  return <MotionVideo locale={locale} />;
}

export function MotionVideo({ locale = "zh" }: VideoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = script[locale].motion;

  return (
    <AbsoluteFill style={styles.stage}>
      <MusicBed durationInFrames={motionDurationFrames} />
      <Grid />
      <Sequence from={0} durationInFrames={7 * fps} premountFor={fps}>
        <Opening locale={locale} copy={c.opening} />
      </Sequence>
      <Sequence from={6 * fps} durationInFrames={7 * fps} premountFor={fps}>
        <BlockScene locale={locale} copy={c.block} blocked={c.blocked} />
      </Sequence>
      <Sequence from={12 * fps} durationInFrames={7 * fps} premountFor={fps}>
        <StatsScene locale={locale} copy={c.stats} today={c.today} total={c.total} />
      </Sequence>
      <Sequence from={18 * fps} durationInFrames={6 * fps} premountFor={fps}>
        <PrivacyScene locale={locale} copy={c.privacy} outro={c.outro} />
      </Sequence>
      <FrameCounter frame={frame} durationInFrames={motionDurationFrames} />
    </AbsoluteFill>
  );
}

export function DemoVideo({ locale = "zh" }: VideoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = script[locale].demo;

  return (
    <AbsoluteFill style={styles.stage}>
      <MusicBed durationInFrames={demoDurationFrames} />
      <Grid />
      <Sequence from={0} durationInFrames={4.6 * fps} premountFor={fps}>
        <DemoScene locale={locale} step={0} steps={c.steps} copy={c.scenes[0]}>
          <StartFocusMock locale={locale} start={c.start} />
        </DemoScene>
      </Sequence>
      <Sequence from={3.8 * fps} durationInFrames={4.8 * fps} premountFor={fps}>
        <DemoScene locale={locale} step={1} steps={c.steps} copy={c.scenes[1]}>
          <BlockedMock title={c.blockedTitle} body={c.blockedBody} />
        </DemoScene>
      </Sequence>
      <Sequence from={7.8 * fps} durationInFrames={4.8 * fps} premountFor={fps}>
        <DemoScene locale={locale} step={2} steps={c.steps} copy={c.scenes[2]}>
          <RulesMock blocklist={c.blocklist} allowlist={c.allowlist} />
        </DemoScene>
      </Sequence>
      <Sequence from={11.8 * fps} durationInFrames={4.2 * fps} premountFor={fps}>
        <DemoScene locale={locale} step={3} steps={c.steps} copy={c.scenes[3]}>
          <DemoStatsMock review={c.review} local={c.local} />
        </DemoScene>
      </Sequence>
      <FrameCounter frame={frame} durationInFrames={demoDurationFrames} />
    </AbsoluteFill>
  );
}

function MusicBed({ durationInFrames }: { durationInFrames: number }) {
  const { fps } = useVideoConfig();

  return (
    <Audio
      src={staticFile("audio/upbeat-loop.wav")}
      loop
      loopVolumeCurveBehavior="extend"
      volume={(frame) => {
        const fadeIn = interpolate(frame, [0, fps], [0, 0.22], clamp);
        const fadeOut = interpolate(frame, [durationInFrames - 1.4 * fps, durationInFrames - 0.2 * fps], [0.22, 0], clamp);
        return Math.min(fadeIn, fadeOut);
      }}
    />
  );
}

function Opening({ locale, copy }: { locale: Locale; copy: readonly [string, string, string] }) {
  return (
    <Scene>
      <Copy locale={locale} eyebrow={copy[0]} title={copy[1]} body={copy[2]} />
      <BrowserMock locale={locale} />
    </Scene>
  );
}

function BlockScene({ locale, copy, blocked }: { locale: Locale; copy: readonly [string, string, string]; blocked: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slide = interpolate(frame, [0, 1.2 * fps], [120, 0], easeOut);
  const fade = interpolate(frame, [0, 0.8 * fps], [0, 1], clamp);

  return (
    <Scene>
      <div style={{ ...styles.domainWall, opacity: fade, transform: `translateX(${slide}px)` }}>
        {["youtube.com", "x.com", "bilibili.com", "reddit.com"].map((domain, index) => (
          <div key={domain} style={{ ...styles.domainCard, transform: `translateY(${Math.sin((frame + index * 18) / 16) * 8}px)` }}>
            <span>{domain}</span>
            <strong>{blocked}</strong>
          </div>
        ))}
      </div>
      <Copy locale={locale} eyebrow={copy[0]} title={copy[1]} body={copy[2]} />
    </Scene>
  );
}

function StatsScene({ locale, copy, today, total }: { locale: Locale; copy: readonly [string, string, string]; today: string; total: string }) {
  return (
    <Scene>
      <Copy locale={locale} eyebrow={copy[0]} title={copy[1]} body={copy[2]} />
      <StatsBoard today={today} total={total} />
    </Scene>
  );
}

function PrivacyScene({ locale, copy, outro }: { locale: Locale; copy: readonly [string, string, string]; outro: readonly [string, string] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seal = spring({ frame: frame - 0.6 * fps, fps, config: { damping: 200 } });

  return (
    <Scene>
      <div style={styles.privacyPanel}>
        <div style={{ ...styles.seal, transform: `scale(${interpolate(seal, [0, 1], [0.72, 1])})` }}>{copy[0]}</div>
        <h2 style={{ ...styles.privacyTitle, fontSize: locale === "en" ? 66 : 72 }}>{copy[1]}</h2>
        <p style={styles.privacyText}>{copy[2]}</p>
      </div>
      <div style={styles.outro}>
        <span>{outro[0]}</span>
        <strong>{outro[1]}</strong>
      </div>
    </Scene>
  );
}

function BrowserMock({ locale }: { locale: Locale }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = script[locale].motion;
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
          <span>{c.focusStatus}</span>
          <strong>18:42</strong>
        </div>
        <div style={styles.timer}>25m</div>
        <div style={styles.progress}>
          <b style={{ ...styles.progressFill, width: `${progress * 100}%` }} />
        </div>
        <div style={styles.buttons}>
          <span>{c.pause}</span>
          <span>{c.end}</span>
        </div>
        <ul style={styles.list}>
          <li style={styles.listRow}><span>youtube.com</span><b>{c.blocked}</b></li>
          <li style={styles.listRow}><span>x.com</span><b>{c.blocked}</b></li>
          <li style={styles.listRow}><span>docs.google.com</span><b>{c.allow}</b></li>
        </ul>
      </div>
    </div>
  );
}

function StatsBoard({ today, total }: { today: string; total: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = [
    ["github.com", 0.92, "46m"],
    ["docs.google.com", 0.68, "34m"],
    ["youtube.com", 0.28, "14m"]
  ] as const;

  return (
    <div style={styles.statsBoard}>
      <div style={styles.statsHead}>
        <span>{today}</span>
        <strong>{total}</strong>
      </div>
      {rows.map(([domain, width, time], index) => {
        const grow = interpolate(frame, [index * 8, 1.2 * fps + index * 8], [0.04, width], easeOut);
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

function DemoScene({ locale, step, steps, copy, children }: { locale: Locale; step: number; steps: readonly string[]; copy: readonly [string, string]; children: ReactNode }) {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [0, 24], [0, 1], easeOut);

  return (
    <AbsoluteFill style={styles.demoScene}>
      <div style={{ ...styles.demoCopy, opacity: appear, transform: `translateY(${interpolate(appear, [0, 1], [34, 0])}px)` }}>
        <div style={styles.stepRail}>
          {steps.map((label, index) => (
            <div key={label} style={{ ...styles.stepItem, color: index === step ? ink : muted }}>
              <span style={{ ...styles.stepDot, backgroundColor: index === step ? clay : "transparent" }}>{index + 1}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
        <h1 style={{ ...styles.demoTitle, fontSize: locale === "en" ? 82 : 92 }}>{copy[0]}</h1>
        <p style={styles.demoBody}>{copy[1]}</p>
      </div>
      <div style={{ ...styles.demoMockWrap, opacity: appear, transform: `translateX(${interpolate(appear, [0, 1], [80, 0])}px)` }}>
        {children}
      </div>
    </AbsoluteFill>
  );
}

function StartFocusMock({ locale, start }: { locale: Locale; start: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const press = interpolate(frame, [1.2 * fps, 1.45 * fps, 1.8 * fps], [0, 1, 0], clamp);
  const progress = interpolate(frame, [1.5 * fps, 4 * fps], [0.18, 0.42], clamp);
  const status = locale === "zh" ? "准备开始" : "Ready";

  return (
    <div style={styles.demoPopup}>
      <div style={styles.popupHead}>
        <span>01Kit</span>
        <strong>{status}</strong>
      </div>
      <div style={styles.timer}>25m</div>
      <div style={styles.progress}>
        <b style={{ ...styles.progressFill, width: `${progress * 100}%` }} />
      </div>
      <button style={{ ...styles.demoButton, transform: `scale(${interpolate(press, [0, 1], [1, 0.96])})` }}>{start}</button>
      <Cursor x={392} y={380} active={press} />
    </div>
  );
}

function BlockedMock({ title, body }: { title: string; body: string }) {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame / 8), [-1, 1], [0.88, 1], clamp);

  return (
    <div style={styles.blockedBrowser}>
      <div style={styles.browserBar}>
        <i style={styles.dot} />
        <i style={styles.dot} />
        <i style={styles.dot} />
        <span>youtube.com</span>
      </div>
      <div style={styles.blockedPanel}>
        <div style={{ ...styles.blockMark, transform: `scale(${pulse})` }}>!</div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
    </div>
  );
}

function RulesMock({ blocklist, allowlist }: { blocklist: string; allowlist: string }) {
  const frame = useCurrentFrame();

  return (
    <div style={styles.rulesPanel}>
      <RuleColumn title={blocklist} tone={clay} rows={["youtube.com", "x.com", "reddit.com"]} frame={frame} />
      <RuleColumn title={allowlist} tone={moss} rows={["github.com", "docs.google.com", "notion.so"]} frame={frame + 12} />
    </div>
  );
}

function RuleColumn({ title, rows, tone, frame }: { title: string; rows: readonly string[]; tone: string; frame: number }) {
  return (
    <div style={styles.ruleColumn}>
      <h3 style={{ color: tone }}>{title}</h3>
      {rows.map((row, index) => {
        const x = interpolate(frame, [index * 8, index * 8 + 24], [40, 0], easeOut);
        const opacity = interpolate(frame, [index * 8, index * 8 + 18], [0, 1], clamp);
        return (
          <div key={row} style={{ ...styles.ruleRow, opacity, transform: `translateX(${x}px)` }}>
            <span>{row}</span>
            <b style={{ backgroundColor: tone }} />
          </div>
        );
      })}
    </div>
  );
}

function DemoStatsMock({ review, local }: { review: string; local: string }) {
  return (
    <div style={styles.demoStats}>
      <StatsBoard today={review} total="2h 18m" />
      <div style={styles.localChip}>{local}</div>
    </div>
  );
}

function Cursor({ x, y, active }: { x: number; y: number; active: number }) {
  return (
    <div style={{ ...styles.cursor, left: x, top: y, transform: `translate(-10px, -8px) scale(${interpolate(active, [0, 1], [1, 0.88])})` }}>
      <svg width="54" height="62" viewBox="0 0 54 62" fill="none">
        <path d="M6 4L45 34L28 38L18 57L6 4Z" fill={ink} />
        <path d="M10 12L37 33L25 36L18 50L10 12Z" fill={cream} />
      </svg>
    </div>
  );
}

function Copy({ locale, eyebrow, title, body }: { locale: Locale; eyebrow: string; title: string; body: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 0.8 * fps], [0, 1], clamp);
  const y = interpolate(frame, [0, 0.8 * fps], [36, 0], easeOut);

  return (
    <div style={{ ...styles.copy, opacity, transform: `translateY(${y}px)` }}>
      <p style={styles.eyebrow}>{eyebrow}</p>
      <h1 style={{ ...styles.title, fontSize: 96 }}>
        {title.split("\n").map((line) => (
          <span key={line} style={styles.titleLine}>{line}</span>
        ))}
      </h1>
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

function FrameCounter({ frame, durationInFrames }: { frame: number; durationInFrames: number }) {
  const opacity = interpolate(frame, [durationInFrames - 60, durationInFrames - 10], [0, 1], clamp);
  return <div style={{ ...styles.footerMark, opacity }}>01kit-chrome.01mvp.com</div>;
}

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const
};

const easeOut = {
  ...clamp,
  easing: Easing.bezier(0.16, 1, 0.3, 1)
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
    display: "grid",
    lineHeight: 0.98,
    letterSpacing: 0,
    maxWidth: 780
  },
  titleLine: {
    whiteSpace: "nowrap"
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
  demoScene: {
    display: "grid",
    gridTemplateColumns: "0.78fr 1.22fr",
    alignItems: "center",
    gap: 86,
    padding: "96px 128px"
  },
  demoCopy: {
    display: "grid",
    gap: 34,
    maxWidth: 680
  },
  stepRail: {
    display: "grid",
    gap: 14,
    fontSize: 22
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: 14
  },
  stepDot: {
    width: 36,
    height: 36,
    display: "grid",
    placeItems: "center",
    border: `2px solid ${ink}`,
    borderRadius: "50%",
    color: ink,
    fontWeight: 950
  },
  demoTitle: {
    margin: 0,
    lineHeight: 1,
    letterSpacing: 0
  },
  demoBody: {
    margin: 0,
    color: "#4b453a",
    fontSize: 34,
    lineHeight: 1.45
  },
  demoMockWrap: {
    justifySelf: "end",
    width: 820,
    minHeight: 660,
    display: "grid",
    placeItems: "center"
  },
  demoPopup: {
    position: "relative",
    width: 560,
    display: "grid",
    gap: 28,
    border: `3px solid ${ink}`,
    borderRadius: 30,
    padding: 38,
    backgroundColor: cream,
    boxShadow: `28px 28px 0 ${ink}`
  },
  demoButton: {
    height: 72,
    border: `3px solid ${ink}`,
    borderRadius: 999,
    backgroundColor: ink,
    color: cream,
    fontSize: 28,
    fontWeight: 950
  },
  cursor: {
    position: "absolute",
    width: 54,
    height: 62
  },
  blockedBrowser: {
    width: 780,
    minHeight: 610,
    overflow: "hidden",
    border: `3px solid ${ink}`,
    borderRadius: 34,
    backgroundColor: "#e9ddca",
    boxShadow: `28px 28px 0 ${ink}`
  },
  blockedPanel: {
    minHeight: 520,
    display: "grid",
    alignContent: "center",
    justifyItems: "center",
    gap: 22,
    padding: 70,
    textAlign: "center",
    backgroundColor: cream
  },
  blockMark: {
    width: 116,
    height: 116,
    display: "grid",
    placeItems: "center",
    border: `3px solid ${ink}`,
    borderRadius: "50%",
    backgroundColor: clay,
    color: cream,
    fontSize: 76,
    fontWeight: 950
  },
  rulesPanel: {
    width: 820,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24
  },
  ruleColumn: {
    display: "grid",
    gap: 18,
    border: `3px solid ${ink}`,
    borderRadius: 28,
    padding: 34,
    backgroundColor: cream,
    boxShadow: `18px 18px 0 ${ink}`
  },
  ruleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    border: `2px solid ${ink}`,
    borderRadius: 16,
    padding: "20px 22px",
    fontSize: 24,
    fontWeight: 900
  },
  demoStats: {
    position: "relative",
    transform: "scale(0.9)"
  },
  localChip: {
    position: "absolute",
    right: -12,
    bottom: -18,
    border: `3px solid ${ink}`,
    borderRadius: 999,
    backgroundColor: sky,
    color: cream,
    padding: "16px 28px",
    fontSize: 26,
    fontWeight: 950
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
