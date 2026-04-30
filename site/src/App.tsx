import { useEffect } from "react";

const downloadUrl = "/downloads/01kit-chrome.zip";
const tutorialUrl = "/docs/01kit-guide.md";
const mvpUrl = "https://01mvp.com";
const currentVersion = "0.1";

type Locale = "zh" | "en";
type SiteVideo = {
  label: string;
  title: string;
  body: string;
  src: string;
  poster: string;
};

const copy = {
  zh: {
    htmlLang: "zh-CN",
    title: "01Kit Chrome - 本地优先的浏览器工作台",
    description: "01Kit 是一个本地优先的浏览器工作台，用来管理专注、网站屏蔽、时间记录和常用小工具。",
    navLabel: "主导航",
    nav: {
      features: "功能",
      video: "视频",
      install: "安装",
      changelog: "更新",
      guide: "使用说明",
      privacy: "隐私",
      language: "EN"
    },
    hero: {
      badges: ["本地优先", "零上传", "开源"],
      title: <>浏览器里的<br />个人工作台</>,
      lead: <>管理专注、屏蔽打扰、记录时间。<br />所有数据保存在浏览器本地，永不上传。</>,
      store: "上架中，请耐心等待",
      download: "下载离线包"
    },
    mock: {
      aria: "01Kit 插件界面示意",
      status: "专注中",
      pause: "暂停 5 分钟",
      end: "结束专注"
    },
    strip: ["专注计时", "网站屏蔽", "时间统计", "小工具入口", "本地数据"],
    videos: {
      eyebrow: "演示视频",
      title: "把浏览器里的打扰变成可控状态",
      lead: "先挡住最容易顺手打开的网站，再用时间线看清浏览时间去了哪里。",
      video: {
        label: "01Kit 演示",
        title: "从拦截到复盘",
        body: "注意力、规则和记录放在一个本地入口里，打开浏览器就能用。",
        src: "/media/01kit-demo-zh.mp4",
        poster: "/media/01kit-demo-zh-poster.png"
      }
    },
    features: {
      eyebrow: "核心功能",
      title: "从注意力管理开始，放下常用的小工具",
      items: [
        ["专注计时", "25/45/60 分钟预设，或自定义 1-240 分钟。一键开启，自动屏蔽分心网站。"],
        ["智能屏蔽", "黑名单拦截干扰源，白名单保护工作流。专注期间自动生效，结束后恢复访问。"],
        ["时间统计", "按域名记录停留时间，支持日/周/月视图。窗口失焦不计时，数据真实可靠。"],
        ["小工具入口", "后续会继续加入围绕浏览器使用习惯的本地工具，保持轻量，不打扰当前页面。"],
        ["本地存储", "所有数据保存在浏览器本地，不上传服务器。可以一键清除记录。"]
      ],
      noteLabel: "使用说明",
      notePrefix: "第一次使用？查看",
      noteLink: "安装和使用说明",
      noteSuffix: "，快速了解安装、专注、屏蔽和数据导出。"
    },
    privacyBand: {
      eyebrow: "隐私承诺",
      title: "数据不出浏览器",
      body: <>01Kit 需要全站点权限来识别域名、统计时间和执行屏蔽规则。<strong>所有操作都在本地完成</strong>，不读取页面内容，不使用同步存储，不上传任何数据到服务器。你可以随时清除历史记录。</>
    },
    install: {
      eyebrow: "安装方式",
      title: "两种安装方式",
      steps: [
        ["Chrome 应用商店", "Chrome 应用商店正在上架中，暂时可以使用离线安装包。", "上架中，请耐心等待"],
        ["离线安装包", <>不能访问商店时，下载离线包，打开 <code>chrome://extensions</code>，启用开发者模式后加载解压目录。</>, "下载离线包"]
      ]
    },
    changelog: {
      eyebrow: "更新日志",
      title: `版本 ${currentVersion}`,
      lead: "01Kit 的第一个版本，从本地优先的注意力管理和时间记录开始。",
      back: "返回 01Kit",
      releases: [
        {
          version: currentVersion,
          date: "2026-04-27",
          dateIso: "2026-04-27",
          title: "第一个可用版本",
          items: [
            "专注计时支持 25/45/60 分钟预设，也可以自定义 1-240 分钟。",
            "专注期间自动拦截黑名单网站，并保留白名单工作流。",
            "按域名记录浏览时间，支持日、周、月视图。",
            "统计、站点列表和设置保存在 Chrome 本地存储，不上传服务器。",
            "官网提供演示视频、隐私说明和离线安装包入口。"
          ]
        }
      ]
    },
    footer: {
      makerPrefix: "01Kit by",
      maker: "01MVP",
      guide: "使用说明",
      changelog: "更新日志",
      privacy: "隐私说明"
    },
    privacy: {
      back: "返回 01Kit",
      title: "01Kit 隐私说明",
      paragraphs: [
        "01Kit 不上传你的浏览记录、专注记录或站点配置。",
        "插件会在本地识别当前标签页域名，用于网站屏蔽和按域名聚合的时间统计。",
        "插件使用 Chrome 本地存储保存时间统计、专注记录、黑名单、白名单和偏好设置，不使用同步存储。",
        "全站点权限只用于在本地识别当前域名和执行屏蔽规则，不读取页面正文、表单内容、Cookie、账号密码或个人通信内容，也不会向外发送数据。",
        "你可以在插件设置页清除全部统计数据。",
        "01Kit 不出售、不转让、不共享用户数据，也不会把用户数据用于广告或再营销。",
        "离线安装包托管在本站，下载行为可能会被 Cloudflare 按常规方式记录访问日志。"
      ]
    }
  },
  en: {
    htmlLang: "en",
    title: "01Kit Chrome - A local-first browser workspace",
    description: "01Kit is a local-first browser workspace for focus, site blocking, time records, and small personal tools.",
    navLabel: "Primary navigation",
    nav: {
      features: "Features",
      video: "Videos",
      install: "Install",
      changelog: "Changelog",
      guide: "Guide",
      privacy: "Privacy",
      language: "中文"
    },
    hero: {
      badges: ["Local-first", "No uploads", "Open source"],
      title: <>A personal workspace<br />inside your browser</>,
      lead: <>Manage focus, block distractions, and track browser time.<br />Your data stays in your browser.</>,
      store: "Chrome Web Store review in progress",
      download: "Download offline package"
    },
    mock: {
      aria: "01Kit extension interface preview",
      status: "Focus running",
      pause: "Pause 5 min",
      end: "End focus"
    },
    strip: ["Focus timer", "Site blocking", "Time stats", "Tool entries", "Local data"],
    videos: {
      eyebrow: "Demo video",
      title: "Turn browser distractions into something manageable",
      lead: "Block the sites you open by reflex, then use the timeline to see where browser time went.",
      video: {
        label: "01Kit demo",
        title: "From blocking to review",
        body: "Focus, rules, and records live in one local entry point for everyday browser work.",
        src: "/media/01kit-demo-en.mp4",
        poster: "/media/01kit-demo-en-poster.png"
      }
    },
    features: {
      eyebrow: "Core features",
      title: "Start with attention management, keep room for small tools",
      items: [
        ["Focus timer", "Use 25/45/60 minute presets or set any duration from 1 to 240 minutes. Start once and blocking turns on automatically."],
        ["Smart blocking", "Blocklist distracting sites and keep work sites open with an allowlist. Rules activate during focus and restore afterward."],
        ["Time stats", "See time by domain across day, week, and month views. Unfocused windows are not counted."],
        ["Tool entries", "More local tools around browser habits can be added over time without cluttering the current page."],
        ["Local storage", "Stats, lists, and settings stay in Chrome local storage. Clear history at any time."]
      ],
      noteLabel: "Guide",
      notePrefix: "New to 01Kit? Read the",
      noteLink: "setup and usage guide",
      noteSuffix: " for install, focus mode, blocking, and data export."
    },
    privacyBand: {
      eyebrow: "Privacy",
      title: "Your data stays in the browser",
      body: <>01Kit asks for all-site permission so it can read the current domain, track time, and apply blocking rules. <strong>Everything runs locally</strong>: it does not read page content, use sync storage, or upload browsing data.</>
    },
    install: {
      eyebrow: "Install",
      title: "Two ways to install",
      steps: [
        ["Chrome Web Store", "The Chrome Web Store listing is under review. Please use the offline package for now.", "Coming soon"],
        ["Offline package", <>If the store is not available, download the package, open <code>chrome://extensions</code>, enable Developer mode, and load the extracted folder.</>, "Download package"]
      ]
    },
    changelog: {
      eyebrow: "Changelog",
      title: `Version ${currentVersion}`,
      lead: "The first 01Kit release starts with local-first attention management and time records.",
      back: "Back to 01Kit",
      releases: [
        {
          version: currentVersion,
          date: "Apr 27, 2026",
          dateIso: "2026-04-27",
          title: "First usable release",
          items: [
            "Focus timer with 25/45/60 minute presets and custom 1-240 minute sessions.",
            "Blocklist enforcement during focus sessions while allowlisted work sites stay available.",
            "Domain-level time stats across day, week, and month views.",
            "Stats, site lists, and settings stay in Chrome local storage without uploads.",
            "Product site includes the demo video, privacy page, and offline package link."
          ]
        }
      ]
    },
    footer: {
      makerPrefix: "01Kit by",
      maker: "01MVP",
      guide: "Guide",
      changelog: "Changelog",
      privacy: "Privacy"
    },
    privacy: {
      back: "Back to 01Kit",
      title: "01Kit Privacy",
      paragraphs: [
        "01Kit does not upload your browsing history, focus records, or site lists.",
        "The extension identifies the current tab's domain locally for site blocking and domain-level time stats.",
        "The extension stores time stats, focus records, blocklists, allowlists, and preferences in Chrome local storage. It does not use sync storage.",
        "All-site permission is used locally to identify the current domain and apply blocking rules. 01Kit does not read page body text, form content, cookies, passwords, or personal communications, and does not send browsing data out.",
        "You can clear all stats at any time.",
        "01Kit does not sell, transfer, share, or use user data for advertising or remarketing.",
        "The offline package is hosted on this site. Cloudflare may record standard access logs for download requests."
      ]
    }
  }
} as const;

export default function App() {
  const locale = getLocale();
  const pagePath = getPagePath(locale);
  const isPrivacy = pagePath === "/privacy";
  const isChangelog = pagePath === "/changelog";
  const c = copy[locale];

  useEffect(() => {
    document.documentElement.lang = c.htmlLang;
    document.title = isPrivacy ? `${c.privacy.title} - 01Kit` : isChangelog ? `${c.changelog.title} - 01Kit` : c.title;

    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) {
      description.content = c.description;
    }
  }, [c, isChangelog, isPrivacy]);

  if (isPrivacy) {
    return <Privacy locale={locale} />;
  }

  if (isChangelog) {
    return <Changelog locale={locale} />;
  }

  const homePath = localizedPath(locale, "/");
  const privacyPath = localizedPath(locale, "/privacy");
  const changelogPath = localizedPath(locale, "/changelog");
  const languagePath = localizedPath(locale === "zh" ? "en" : "zh", "/");

  return (
    <main>
      <header className="site-header">
        <nav aria-label={c.navLabel}>
          <a className="brand" href={homePath}>
            <img src="/icon.svg" alt="" />
            <strong>01Kit</strong>
          </a>
          <div className="nav-links">
            <a href="#features">{c.nav.features}</a>
            <a href="#video">{c.nav.video}</a>
            <a href="#install">{c.nav.install}</a>
            <a href={changelogPath}>{c.nav.changelog}</a>
            <a href={tutorialUrl}>{c.nav.guide}</a>
            <a href={privacyPath}>{c.nav.privacy}</a>
            <a className="language-link" href={languagePath} lang={locale === "zh" ? "en" : "zh-CN"}>
              {c.nav.language}
            </a>
          </div>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="hero-badge">
            {c.hero.badges.map((badge, index) => (
              <span key={badge}>{index === 0 ? badge : `· ${badge}`}</span>
            ))}
          </div>
          <h1>{c.hero.title}</h1>
          <p className="hero-lead">{c.hero.lead}</p>
          <div className="cta">
            <span className="primary pending" aria-disabled="true">
              <span>{c.hero.store}</span>
            </span>
            <a className="secondary" href={downloadUrl}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2V11M8 11L5 8M8 11L11 8M2 14H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{c.hero.download}</span>
            </a>
          </div>
        </div>

        <div className="product-shot" aria-label={c.mock.aria}>
          <div className="browser-bar">
            <span />
            <span />
            <span />
          </div>
          <div className="mock-popup">
            <div className="mock-head">
              <span>01Kit</span>
              <div className="status-badge">{c.mock.status}</div>
            </div>
            <div className="timer">18:42</div>
            <div className="progress">
              <span />
            </div>
            <div className="mock-actions">
              <span>{c.mock.pause}</span>
              <span>{c.mock.end}</span>
            </div>
            <div className="site-list">
              <div>
                <span>youtube.com</span>
                <strong>32m</strong>
              </div>
              <div>
                <span>x.com</span>
                <strong>18m</strong>
              </div>
              <div>
                <span>docs.google.com</span>
                <strong>46m</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="strip">
        {c.strip.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>

      <section className="video-section" id="video">
        <div className="section-copy">
          <p className="eyebrow">{c.videos.eyebrow}</p>
          <h2>{c.videos.title}</h2>
          <p>{c.videos.lead}</p>
        </div>
        <VideoCard video={c.videos.video} />
      </section>

      <section className="features" id="features">
        <div className="features-header">
          <p className="eyebrow">{c.features.eyebrow}</p>
          <h2>{c.features.title}</h2>
        </div>
        <div className="features-grid">
          {c.features.items.map(([title, body], index) => (
            <article className={`feature-card ${index < 2 ? "feature-primary" : ""}`} key={title}>
              <div className="feature-index">{String(index + 1).padStart(2, "0")}</div>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <div className="dev-note">
          <span className="dev-badge">{c.features.noteLabel}</span>
          <p>
            {c.features.notePrefix}
            <a href={tutorialUrl}>{c.features.noteLink}</a>
            {c.features.noteSuffix}
          </p>
        </div>
      </section>

      <section className="privacy-band">
        <div>
          <p className="eyebrow">{c.privacyBand.eyebrow}</p>
          <h2>{c.privacyBand.title}</h2>
        </div>
        <p>{c.privacyBand.body}</p>
      </section>

      <section className="install" id="install">
        <div>
          <p className="eyebrow">{c.install.eyebrow}</p>
          <h2>{c.install.title}</h2>
        </div>
        <div className="install-content">
          <div className="steps">
            {c.install.steps.map(([title, body, action], index) => (
              <article key={title}>
                <span>{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                  {index === 0 ? (
                    <button className="install-btn primary pending" type="button" disabled>{action}</button>
                  ) : (
                    <a className="install-btn secondary" href={downloadUrl}>{action}</a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <span>
          {c.footer.makerPrefix} <a href={mvpUrl}>{c.footer.maker}</a>
        </span>
        <a href={tutorialUrl}>{c.footer.guide}</a>
        <a href={changelogPath}>{c.footer.changelog}</a>
        <a href={privacyPath}>{c.footer.privacy}</a>
      </footer>
    </main>
  );
}

function VideoCard({ video }: { video: SiteVideo }) {
  return (
    <article className="video-card">
      <div className="video-copy">
        <p className="video-label">{video.label}</p>
        <h3>{video.title}</h3>
        <p>{video.body}</p>
      </div>
      <video controls playsInline preload="metadata" poster={video.poster}>
        <source src={video.src} type="video/mp4" />
      </video>
    </article>
  );
}

function Changelog({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const homePath = localizedPath(locale, "/");
  const languagePath = localizedPath(locale === "zh" ? "en" : "zh", "/changelog");

  return (
    <main className="content-page changelog">
      <div className="page-actions">
        <a href={homePath}>← {c.changelog.back}</a>
        <a href={languagePath} lang={locale === "zh" ? "en" : "zh-CN"}>
          {c.nav.language}
        </a>
      </div>
      <p className="eyebrow">{c.changelog.eyebrow}</p>
      <h1>{c.changelog.title}</h1>
      <p className="page-lead">{c.changelog.lead}</p>
      <div className="release-list">
        {c.changelog.releases.map((release) => (
          <article className="release-card" key={release.version}>
            <div className="release-meta">
              <span>{release.version}</span>
              <time dateTime={release.dateIso}>{release.date}</time>
            </div>
            <h2>{release.title}</h2>
            <ul>
              {release.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </main>
  );
}

function Privacy({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const homePath = localizedPath(locale, "/");
  const languagePath = localizedPath(locale === "zh" ? "en" : "zh", "/privacy");

  return (
    <main className="privacy">
      <div className="privacy-actions">
        <a href={homePath}>← {c.privacy.back}</a>
        <a href={languagePath} lang={locale === "zh" ? "en" : "zh-CN"}>
          {c.nav.language}
        </a>
      </div>
      <h1>{c.privacy.title}</h1>
      {c.privacy.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </main>
  );
}

function getLocale(): Locale {
  return window.location.pathname === "/en" || window.location.pathname.startsWith("/en/") ? "en" : "zh";
}

function getPagePath(locale: Locale): string {
  if (locale === "en") {
    const path = window.location.pathname.replace(/^\/en/, "");
    return path === "" ? "/" : path;
  }

  return window.location.pathname;
}

function localizedPath(locale: Locale, path: "/" | "/privacy" | "/changelog"): string {
  if (locale === "en") {
    return path === "/" ? "/en" : `/en${path}`;
  }

  return path;
}
