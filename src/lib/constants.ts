import type { FocusSettings, TrackerState } from "./types";

export const APP_NAME = "01Kit";
export const RULE_ID_BASE = 1000;
export const GLOBAL_RULE_ID_BASE = 2000;
export const GLOBAL_ALLOW_RULE_ID_BASE = 3000;
export const RULE_ID_COUNT = 400;
export const FOCUS_END_ALARM = "01kit-focus-end";
export const FOCUS_PAUSE_END_ALARM = "01kit-focus-pause-end";
export const TRACKER_TICK_ALARM = "01kit-tracker-tick";
export const DEFAULT_FOCUS_MINUTES = 25;
export const TRACKER_MAX_DAYS = 120;
export const FOCUS_RECORD_MAX_COUNT = 2000;
export const REPOSITORY_URL = "https://github.com/makerjackie/01kit-chrome";
export const FEEDBACK_URL = "https://github.com/makerjackie/01kit-chrome/issues";
export const EXTENSION_TUTORIAL_URL = "https://www.01mvp.com/docs/mvp/ai-chrome-extension-guide";
export const AUTHOR_EMAIL = "makerjackie@qq.com";

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

export const DEFAULT_SETTINGS: FocusSettings = {
  globalBlacklist: [],
  blacklist: DEFAULT_BLACKLIST,
  whitelist: DEFAULT_WHITELIST,
  categories: {
    "bilibili.com": "video",
    "douyin.com": "entertainment",
    "developer.chrome.com": "learn",
    "github.com": "work",
    "reddit.com": "social",
    "tiktok.com": "entertainment",
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
  "把这一分钟留给手上的事。",
  "先完成一小步，再回来也不迟。",
  "不用和这个页面拉扯，回去写下一句。",
  "少开一个标签，今天会轻一点。",
  "还剩一点时间，先把注意力放回去。",
  "想看的东西不会跑，专注的状态更难得。",
  "先别急，给手上的事一个完整的收尾。",
  "今天不需要完美，只要少走神一次。"
];
