import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "01Kit",
    short_name: "01Kit",
    version: "0.1.0",
    description: "专注模式、网站屏蔽、时间统计和本地生产力记录。",
    permissions: [
      "alarms",
      "declarativeNetRequest",
      "idle",
      "notifications",
      "storage",
      "tabs"
    ],
    host_permissions: ["<all_urls>"],
    action: {
      default_title: "01Kit"
    },
    options_ui: {
      page: "options.html",
      open_in_tab: true
    },
    commands: {
      "quick-focus": {
        suggested_key: {
          default: "Alt+Shift+F",
          mac: "Alt+Shift+F"
        },
        description: "Start a 25-minute focus session"
      },
      "pause-focus": {
        suggested_key: {
          default: "Alt+Shift+P",
          mac: "Alt+Shift+P"
        },
        description: "Pause focus blocking for 5 minutes"
      }
    },
    icons: {
      "16": "icon/icon-16.png",
      "32": "icon/icon-32.png",
      "48": "icon/icon-48.png",
      "128": "icon/icon-128.png"
    },
    web_accessible_resources: [
      {
        resources: ["blocked.html"],
        matches: ["<all_urls>"]
      }
    ]
  }
});
