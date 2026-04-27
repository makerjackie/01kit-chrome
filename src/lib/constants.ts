import type { FocusSettings, TrackerState } from "./types";

export const APP_NAME = "01Kit";
export const RULE_ID_BASE = 1000;
export const RULE_ID_COUNT = 400;
export const FOCUS_END_ALARM = "01kit-focus-end";
export const FOCUS_PAUSE_END_ALARM = "01kit-focus-pause-end";
export const TRACKER_TICK_ALARM = "01kit-tracker-tick";
export const DEFAULT_FOCUS_MINUTES = 25;
export const TRACKER_MAX_DAYS = 120;

export const DEFAULT_BLACKLIST = [
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

export const DEFAULT_WHITELIST = [
  "01mvp.com",
  "developer.chrome.com",
  "github.com",
  "wxt.dev"
];

export const DEFAULT_TRACKING_EXCLUSIONS = [
  "accounts.google.com",
  "bank",
  "icloud.com",
  "localhost"
];

export const DEFAULT_SETTINGS: FocusSettings = {
  blacklist: DEFAULT_BLACKLIST,
  whitelist: DEFAULT_WHITELIST,
  trackingExclusions: DEFAULT_TRACKING_EXCLUSIONS,
  categories: {
    "bilibili.com": "video",
    "developer.chrome.com": "learn",
    "github.com": "work",
    "reddit.com": "social",
    "x.com": "social",
    "youtube.com": "video",
    "zhihu.com": "news"
  },
  dailyFocusGoalMinutes: 120,
  defaultFocusMinutes: DEFAULT_FOCUS_MINUTES,
  blockMode: "blacklist"
};

export const DEFAULT_TRACKER_STATE: TrackerState = {
  domain: null,
  startedAt: null,
  tabId: null,
  windowFocused: true,
  idle: false
};

export const QUOTES = [
  "现在先把注意力留给重要的事。",
  "离开这个页面，回到你真正想完成的工作。",
  "少一点切换，多一点完成。",
  "今天的进度来自当下这几分钟。",
  "你已经设置了边界，继续保持。"
];
