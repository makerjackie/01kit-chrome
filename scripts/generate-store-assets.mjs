import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const buildDir = resolve(rootDir, ".output/chrome-mv3");
const outputDir = resolve(rootDir, "output/chrome-web-store");
const rawDir = join(outputDir, "raw");
const profileDir = "/tmp/01kit-store-assets-profile";
const port = 9231;
const staticPort = 43871;

const defaultBlacklist = [
  "bilibili.com",
  "douyin.com",
  "facebook.com",
  "instagram.com",
  "reddit.com",
  "tiktok.com",
  "twitter.com",
  "weibo.com",
  "x.com",
  "youtube.com",
  "zhihu.com"
];

const defaultWhitelist = [
  "01mvp.com",
  "developer.chrome.com",
  "github.com",
  "wxt.dev"
];

const trackingExclusions = [
  "accounts.google.com",
  "bank",
  "icloud.com",
  "localhost"
];

class CdpClient {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.events = new Map();
    this.ws = new WebSocket(url);
    this.ready = new Promise((resolveOpen, rejectOpen) => {
      this.ws.addEventListener("open", resolveOpen, { once: true });
      this.ws.addEventListener("error", rejectOpen, { once: true });
    });
    this.ws.addEventListener("message", (event) => this.handleMessage(event));
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);

    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result ?? {});
      }
      return;
    }

    if (message.method && this.events.has(message.method)) {
      const listeners = this.events.get(message.method);
      this.events.delete(message.method);
      for (const listener of listeners) listener(message.params ?? {});
    }
  }

  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  waitForEvent(method, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      const listeners = this.events.get(method) ?? [];
      listeners.push((params) => {
        clearTimeout(timeout);
        resolve(params);
      });
      this.events.set(method, listeners);
    });
  }

  close() {
    this.ws.close();
  }
}

function todayKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function makeSettings() {
  return {
    blacklist: defaultBlacklist,
    whitelist: defaultWhitelist,
    trackingExclusions,
    categories: {
      "bilibili.com": "video",
      "developer.chrome.com": "learn",
      "docs.google.com": "work",
      "github.com": "work",
      "notion.so": "work",
      "reddit.com": "social",
      "x.com": "social",
      "youtube.com": "video",
      "zhihu.com": "news"
    },
    dailyFocusGoalMinutes: 120,
    defaultFocusMinutes: 25,
    blockMode: "blacklist"
  };
}

function makeStats() {
  const days = {};
  const domains = [
    ["docs.google.com", 86],
    ["github.com", 64],
    ["developer.chrome.com", 48],
    ["notion.so", 42],
    ["youtube.com", 26],
    ["x.com", 14],
    ["zhihu.com", 11]
  ];

  for (let offset = -6; offset <= 0; offset += 1) {
    const multiplier = 0.55 + (offset + 6) * 0.08;
    days[todayKey(offset)] = Object.fromEntries(
      domains.map(([domain, minutes], index) => [
        domain,
        Math.max(3, Math.round(minutes * multiplier - index * 2)) * 60_000
      ])
    );
  }

  return { days };
}

function makeRecords() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      id: "record-1",
      startedAt: now - 2 * 60 * 60 * 1000,
      endedAt: now - 95 * 60 * 1000,
      plannedMinutes: 45,
      focusedMs: 43 * 60_000,
      mode: "blacklist",
      completed: true
    },
    {
      id: "record-2",
      startedAt: now - day - 4 * 60 * 60 * 1000,
      endedAt: now - day - 3.5 * 60 * 60 * 1000,
      plannedMinutes: 25,
      focusedMs: 25 * 60_000,
      mode: "whitelist",
      completed: true
    },
    {
      id: "record-3",
      startedAt: now - 2 * day - 6 * 60 * 60 * 1000,
      endedAt: now - 2 * day - 5.2 * 60 * 60 * 1000,
      plannedMinutes: 60,
      focusedMs: 47 * 60_000,
      mode: "blacklist",
      completed: false
    }
  ];
}

function makeSession() {
  const now = Date.now();
  return {
    id: "store-demo-session",
    active: true,
    mode: "blacklist",
    startedAt: now - 6 * 60_000,
    endsAt: now + 18 * 60_000 + 42_000,
    durationMinutes: 25,
    domains: defaultBlacklist
  };
}

async function waitForDevtools() {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (response.ok) return await response.json();
    } catch {
      await new Promise((resolveWait) => setTimeout(resolveWait, 200));
    }
  }
  throw new Error("Chrome DevTools did not start.");
}

async function getPageClient() {
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
  const page = targets.find((item) => item.type === "page");
  if (!page?.webSocketDebuggerUrl) throw new Error("Could not find a page target.");

  const client = new CdpClient(page.webSocketDebuggerUrl);
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  return client;
}

async function createStaticServer() {
  const mimeTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml"
  };

  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", `http://127.0.0.1:${staticPort}`);
      const pathname = decodeURIComponent(requestUrl.pathname === "/" ? "/popup.html" : requestUrl.pathname);
      const filePath = resolve(buildDir, `.${pathname}`);
      if (!filePath.startsWith(buildDir)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      const ext = filePath.slice(filePath.lastIndexOf("."));
      const data = await readFile(filePath);
      response.writeHead(200, {
        "Content-Type": mimeTypes[ext] ?? "application/octet-stream",
        "Cache-Control": "no-store"
      });
      response.end(data);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });

  await new Promise((resolveListen) => server.listen(staticPort, "127.0.0.1", resolveListen));
  return {
    baseUrl: `http://127.0.0.1:${staticPort}`,
    close: () => new Promise((resolveClose) => server.close(resolveClose))
  };
}

async function setViewport(client, width, height) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false
  });
}

async function navigate(client, url) {
  const load = client.waitForEvent("Page.loadEventFired").catch(() => null);
  await client.send("Page.navigate", { url });
  await load;
  await settle(client);
}

async function settle(client) {
  await client.send("Runtime.evaluate", {
    expression: "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
    awaitPromise: true
  });
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description
      ?? result.exceptionDetails.text
      ?? "Runtime evaluation failed."
    );
  }
  return result.result?.value;
}

async function screenshot(client, filePath, width, height) {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false
  });
  await writeFile(filePath, Buffer.from(result.data, "base64"));
}

function assetPage(title, body, extraCss = "") {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root {
      color: #11100e;
      background: #f6f4ee;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
      font-synthesis: none;
      text-rendering: optimizeLegibility;
    }
    * { box-sizing: border-box; }
    body {
      width: 1280px;
      height: 800px;
      margin: 0;
      overflow: hidden;
      background:
        linear-gradient(90deg, rgba(17, 16, 14, 0.055) 1px, transparent 1px),
        linear-gradient(180deg, rgba(17, 16, 14, 0.055) 1px, transparent 1px),
        #f6f4ee;
      background-size: 40px 40px;
    }
    .frame {
      width: 100%;
      height: 100%;
      display: grid;
      grid-template-columns: 460px 1fr;
      gap: 64px;
      padding: 56px 72px;
      align-items: center;
    }
    .copy {
      display: grid;
      align-content: center;
      gap: 26px;
      height: 100%;
    }
    .mark {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      width: fit-content;
      font-size: 18px;
      font-weight: 900;
    }
    .mark img {
      width: 42px;
      height: 42px;
    }
    h1 {
      margin: 0;
      max-width: 8.5ch;
      font-size: 84px;
      line-height: 0.94;
      letter-spacing: 0;
    }
    p {
      margin: 0;
      max-width: 27rem;
      color: #4a453c;
      font-size: 24px;
      line-height: 1.55;
      font-weight: 600;
    }
    .pills {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .pills span {
      border: 1px solid #11100e;
      background: #fffdf7;
      padding: 9px 13px;
      font-size: 16px;
      font-weight: 800;
    }
    .shot {
      justify-self: center;
      overflow: hidden;
      border: 2px solid #11100e;
      background: #fffdf7;
      box-shadow: 18px 18px 0 #11100e;
    }
    .popup-shot {
      width: 410px;
      height: 700px;
    }
    .popup-shot img {
      width: 400px;
      height: 720px;
      object-fit: cover;
      object-position: left top;
      display: block;
    }
    .wide-shot {
      width: 720px;
      height: 450px;
    }
    .wide-shot img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
      object-position: left top;
    }
    .dark {
      background: #11100e;
      color: #f6f4ee;
    }
    .dark p {
      color: #ded8ca;
    }
    .dark .pills span {
      border-color: #f6f4ee;
      background: transparent;
      color: #f6f4ee;
    }
    .dark .shot {
      border-color: #f6f4ee;
      box-shadow: 18px 18px 0 #f6f4ee;
    }
    ${extraCss}
  </style>
</head>
<body>${body}</body>
</html>`;
}

function fileSrc(filePath) {
  return pathToFileURL(filePath).href;
}

function makePreloadScript() {
  const baseState = {
    settings: makeSettings(),
    focusRecords: makeRecords(),
    timeStats: makeStats(),
    trackerState: {
      domain: null,
      startedAt: null,
      tabId: null,
      windowFocused: true,
      idle: false
    }
  };
  const presets = {
    start: { ...baseState, focusSession: null },
    active: { ...baseState, focusSession: makeSession() },
    options: { ...baseState, focusSession: null }
  };

  return `
    (() => {
      const presets = ${JSON.stringify(presets)};
      const clone = (value) => JSON.parse(JSON.stringify(value));
      const demo = new URL(location.href).searchParams.get("demo") || "start";
      const state = clone(presets[demo] || presets.start);
      const read = async (keys) => {
        if (keys == null) return clone(state);
        if (typeof keys === "string") return { [keys]: clone(state[keys]) };
        if (Array.isArray(keys)) {
          return Object.fromEntries(keys.map((key) => [key, clone(state[key])]));
        }
        return Object.fromEntries(Object.entries(keys).map(([key, fallback]) => [
          key,
          state[key] === undefined ? fallback : clone(state[key])
        ]));
      };
      const write = async (values) => {
        Object.assign(state, clone(values));
      };
      globalThis.chrome = {
        alarms: {
          clear: async () => true,
          create: async () => undefined
        },
        declarativeNetRequest: {
          updateDynamicRules: async () => undefined
        },
        idle: {
          queryState: async () => "active",
          setDetectionInterval: () => undefined,
          onStateChanged: { addListener: () => undefined }
        },
        notifications: {
          create: async () => undefined
        },
        runtime: {
          getURL: (path) => new URL(path, location.origin).href,
          openOptionsPage: () => undefined,
          onInstalled: { addListener: () => undefined },
          onStartup: { addListener: () => undefined }
        },
        storage: {
          local: { get: read, set: write },
          onChanged: { addListener: () => undefined }
        },
        tabs: {
          create: async () => undefined,
          query: async () => [],
          onActivated: { addListener: () => undefined },
          onUpdated: { addListener: () => undefined }
        },
        windows: {
          WINDOW_ID_NONE: -1,
          getAll: async () => [],
          onFocusChanged: { addListener: () => undefined }
        },
        commands: {
          onCommand: { addListener: () => undefined }
        }
      };
      document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = "*::-webkit-scrollbar{display:none}*{scrollbar-width:none}";
        document.head.append(style);
      });
    })();
  `;
}

async function renderHtml(client, html, outputPath, width, height) {
  const htmlPath = join(outputDir, "work", `${outputPath.split("/").pop()}.html`);
  await mkdir(dirname(htmlPath), { recursive: true });
  await writeFile(htmlPath, html);
  await setViewport(client, width, height);
  await navigate(client, pathToFileURL(htmlPath).href);
  await screenshot(client, outputPath, width, height);
}

async function main() {
  await rm(outputDir, { recursive: true, force: true });
  await rm(profileDir, { recursive: true, force: true });
  await mkdir(rawDir, { recursive: true });
  await copyFile(resolve(rootDir, "public/icon/icon-128.png"), join(outputDir, "icon-128.png"));
  const staticServer = await createStaticServer();

  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank"
  ], {
    stdio: ["ignore", "ignore", "pipe"]
  });

  chrome.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    if (!text.includes("DevTools listening")) return;
    process.stderr.write(text);
  });

  try {
    await waitForDevtools();
    const client = await getPageClient();
    await client.send("Page.addScriptToEvaluateOnNewDocument", {
      source: makePreloadScript()
    });

    await setViewport(client, 400, 720);
    await navigate(client, `${staticServer.baseUrl}/popup.html?demo=start`);
    await screenshot(client, join(rawDir, "popup-start.png"), 400, 720);

    await setViewport(client, 400, 720);
    await navigate(client, `${staticServer.baseUrl}/popup.html?demo=active`);
    await screenshot(client, join(rawDir, "popup-active.png"), 400, 720);

    await setViewport(client, 1280, 800);
    await navigate(client, `${staticServer.baseUrl}/blocked.html?demo=active#https://www.youtube.com/watch?v=focus`);
    await screenshot(client, join(rawDir, "blocked-page.png"), 1280, 800);

    await setViewport(client, 1280, 800);
    await navigate(client, `${staticServer.baseUrl}/options.html?demo=options#privacy-exclusions`);
    await evaluate(client, "document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, Math.max(0, (document.querySelector('#privacy-exclusions')?.offsetTop ?? 0) - 18))");
    await settle(client);
    await screenshot(client, join(rawDir, "options-privacy.png"), 1280, 800);

    await navigate(client, `${staticServer.baseUrl}/options.html?demo=options#time-stats`);
    await evaluate(client, "document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, Math.max(0, (document.querySelector('#time-stats')?.offsetTop ?? 0) - 18))");
    await settle(client);
    await screenshot(client, join(rawDir, "options-stats.png"), 1280, 800);

    const icon = fileSrc(join(outputDir, "icon-128.png"));
    const popupStart = fileSrc(join(rawDir, "popup-start.png"));
    const popupActive = fileSrc(join(rawDir, "popup-active.png"));
    const blocked = fileSrc(join(rawDir, "blocked-page.png"));
    const optionsPrivacy = fileSrc(join(rawDir, "options-privacy.png"));
    const optionsStats = fileSrc(join(rawDir, "options-stats.png"));

    await renderHtml(client, assetPage("一键开始专注", `
      <main class="frame">
        <section class="copy">
          <div class="mark"><img src="${icon}" alt="" />01Kit</div>
          <h1>一键开始专注</h1>
          <p>选择 25、45、60 分钟，或输入自己的专注时长。屏蔽规则会在本地立即生效。</p>
          <div class="pills"><span>专注计时</span><span>黑名单</span><span>白名单</span></div>
        </section>
        <section class="shot popup-shot"><img src="${popupStart}" alt="" /></section>
      </main>
    `), join(outputDir, "01kit-01-start-focus.png"), 1280, 800);

    await renderHtml(client, assetPage("专注中也能短暂处理", `
      <main class="frame">
        <section class="copy">
          <div class="mark"><img src="${icon}" alt="" />01Kit</div>
          <h1>专注中也能短暂处理</h1>
          <p>确实需要打开网页时，可以暂停 1、5、15 分钟。时间到了自动回到屏蔽状态。</p>
          <div class="pills"><span>暂停窗口</span><span>倒计时</span><span>本地记录</span></div>
        </section>
        <section class="shot popup-shot"><img src="${popupActive}" alt="" /></section>
      </main>
    `), join(outputDir, "01kit-02-focus-running.png"), 1280, 800);

    await renderHtml(client, assetPage("屏蔽页", `
      <main class="full"><img src="${blocked}" alt="" /></main>
    `, `
      body { background: #11100e; }
      .full, .full img { width: 1280px; height: 800px; margin: 0; display: block; }
      .full img { object-fit: cover; object-position: center; }
    `), join(outputDir, "01kit-03-blocked-page.png"), 1280, 800);

    await renderHtml(client, assetPage("规则和隐私排除", `
      <main class="frame options-frame">
        <section class="copy">
          <div class="mark"><img src="${icon}" alt="" />01Kit</div>
          <h1>规则清楚可控</h1>
          <p>黑名单、白名单和隐私排除都在同一个设置页管理。敏感网站可以排除在时间统计之外。</p>
          <div class="pills"><span>黑名单</span><span>白名单</span><span>隐私排除</span></div>
        </section>
        <section class="shot wide-shot"><img src="${optionsPrivacy}" alt="" /></section>
      </main>
    `, `
      .options-frame { grid-template-columns: 440px 1fr; gap: 52px; }
      .wide-shot { width: 700px; height: 520px; }
    `), join(outputDir, "01kit-04-rules-privacy.png"), 1280, 800);

    await renderHtml(client, assetPage("时间统计", `
      <main class="frame options-frame">
        <section class="copy">
          <div class="mark"><img src="${icon}" alt="" />01Kit</div>
          <h1>看见时间花在哪里</h1>
          <p>按今日、本周、本月查看域名停留时间，专注记录和数据导出都保存在本地。</p>
          <div class="pills"><span>时间统计</span><span>专注记录</span><span>CSV / JSON</span></div>
        </section>
        <section class="shot wide-shot"><img src="${optionsStats}" alt="" /></section>
      </main>
    `, `
      .options-frame { grid-template-columns: 440px 1fr; gap: 52px; }
      .wide-shot { width: 700px; height: 520px; }
    `), join(outputDir, "01kit-05-stats-records.png"), 1280, 800);

    await renderHtml(client, assetPage("小宣传图", `
      <main class="promo-small">
        <img src="${icon}" alt="" />
        <strong>01Kit</strong>
        <span></span>
        <span></span>
        <span></span>
      </main>
    `, `
      body { width: 440px; height: 280px; background: #11100e; }
      .promo-small {
        width: 440px;
        height: 280px;
        position: relative;
        overflow: hidden;
        background: #11100e;
        color: #f6f4ee;
      }
      .promo-small img {
        position: absolute;
        left: 38px;
        top: 40px;
        width: 72px;
        height: 72px;
      }
      .promo-small strong {
        position: absolute;
        left: 38px;
        bottom: 36px;
        font-size: 64px;
        line-height: 1;
      }
      .promo-small span {
        position: absolute;
        border: 2px solid #f6f4ee;
        background: #f6f4ee;
      }
      .promo-small span:nth-of-type(1) { right: 42px; top: 42px; width: 118px; height: 26px; }
      .promo-small span:nth-of-type(2) { right: 78px; top: 104px; width: 168px; height: 26px; }
      .promo-small span:nth-of-type(3) { right: 42px; top: 166px; width: 136px; height: 26px; }
    `), join(outputDir, "01kit-small-promo-440x280.png"), 440, 280);

    await renderHtml(client, assetPage("Marquee", `
      <main class="marquee">
        <section>
          <div class="mark"><img src="${icon}" alt="" />01Kit</div>
          <h1>把注意力留给正在做的事</h1>
          <p>专注计时、网站屏蔽和时间统计都在浏览器本地完成。</p>
        </section>
        <div class="panel one"><img src="${popupActive}" alt="" /></div>
        <div class="panel two"><img src="${optionsStats}" alt="" /></div>
      </main>
    `, `
      body { width: 1400px; height: 560px; background: #f6f4ee; }
      .marquee {
        width: 1400px;
        height: 560px;
        position: relative;
        overflow: hidden;
        padding: 58px 72px;
        background:
          linear-gradient(90deg, rgba(17, 16, 14, 0.055) 1px, transparent 1px),
          linear-gradient(180deg, rgba(17, 16, 14, 0.055) 1px, transparent 1px),
          #f6f4ee;
        background-size: 40px 40px;
      }
      .marquee section {
        width: 520px;
        display: grid;
        gap: 26px;
      }
      .marquee h1 {
        max-width: 8.8ch;
        font-size: 80px;
      }
      .marquee p {
        max-width: 29rem;
        font-size: 22px;
      }
      .panel {
        position: absolute;
        overflow: hidden;
        border: 2px solid #11100e;
        background: #fffdf7;
        box-shadow: 14px 14px 0 #11100e;
      }
      .panel img { width: 100%; height: 100%; object-fit: cover; object-position: left top; display: block; }
      .panel.one { right: 510px; top: 58px; width: 285px; height: 430px; }
      .panel.two { right: 72px; top: 98px; width: 390px; height: 300px; }
    `), join(outputDir, "01kit-marquee-promo-1400x560.png"), 1400, 560);

    client.close();
  } finally {
    chrome.kill("SIGTERM");
    await staticServer.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
