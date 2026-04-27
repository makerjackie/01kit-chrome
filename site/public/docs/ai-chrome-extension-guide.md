# 用 AI 开发一个 Chrome 插件

这份教程对应 01Kit 的实际开发流程，适合用来给 AI 下任务，也适合自己检查进度。

## 1. 梳理需求

先把功能写成清单，不要一开始就写代码。

- 插件要解决什么问题：专注、屏蔽网站、统计时间。
- 第一版必须有什么：Popup、Options、后台 Service Worker、屏蔽页。
- 数据放在哪里：设置、统计和记录都用 `chrome.storage.local`。
- 哪些数据不能上传：浏览记录、专注记录、黑名单、白名单。
- 哪些能力需要权限：`storage`、`tabs`、`alarms`、`idle`、`notifications`、`declarativeNetRequest`。

## 2. 技术栈选择

01Kit 使用：

- WXT：负责 Chrome MV3 插件工程化。
- React：写 Popup、Options 和屏蔽页。
- TypeScript：让 Chrome API、存储结构和统计数据更清楚。
- Cloudflare Workers Static Assets：部署官网和离线安装包。

不建议第一版加后端。专注和统计都可以在浏览器本地完成，后端只会增加隐私和维护成本。

## 3. 可以直接发给 AI 的 Prompt

```text
我要做一个 Chrome MV3 插件，名字叫 01Kit。

技术栈：WXT + React + TypeScript。

功能：
1. Popup 支持 25/45/60 分钟专注，也支持 1-240 分钟自定义时长。
2. 支持黑名单模式：专注时屏蔽指定网站。
3. 支持白名单模式：专注时只允许访问指定网站。
4. 支持添加、删除域名，并提供常见干扰网站模板。
5. 访问被屏蔽网站时跳到插件内置屏蔽页，显示剩余时间和返回按钮。
6. 支持临时暂停 5/10/15 分钟。
7. 后台自动统计各网站停留时间，窗口失焦和 idle 状态不计时。
8. Options 页面展示今日、本周、本月 Top 10 网站。
9. 支持一键清除历史数据、导出 CSV/JSON。
10. 支持专注记录、每日目标、快捷键和结束通知。

约束：
- 数据只保存在浏览器本地，不上传服务器。
- 使用 chrome.declarativeNetRequest 做网站屏蔽。
- 设置、统计和记录全部使用 chrome.storage.local。
- UI 要极简黑白，不要写内部说明给用户看。
- 请给出完整文件结构、关键代码和调试步骤。
```

## 4. 开发步骤

1. 初始化 WXT 项目：`npx wxt init 01kit-chrome`。
2. 先做数据结构：设置、当前专注会话、专注记录、时间统计。
3. 写后台逻辑：DNR 规则、定时器、标签页追踪、窗口焦点、idle 检测。
4. 写 Popup：启动专注、暂停、管理常用域名、查看今日统计。
5. 写 Options：详细统计、导出、清除、专注记录。
6. 写屏蔽页：剩余时间、返回、临时暂停。
7. 打包 zip，再用 `chrome://extensions` 加载测试。

## 5. Chrome 插件注意事项

- Manifest V3 使用 Service Worker，后台不是一直常驻，定时逻辑要靠 `chrome.alarms`。
- `declarativeNetRequest` 适合屏蔽主页面请求，比内容脚本更可靠。
- Chrome 商店审核会看权限说明，权限越少越好。
- 隐私政策要单独有 URL，即使不收集数据也要写清楚。
- 上架需要截图、图标、简短描述、详细描述和分类。
- 审核通过前，官网的商店链接只能先指向搜索页或留待替换。

## 6. 国内用户无法访问 Chrome 商店怎么办

做两个入口：

- 官网按钮 1：跳转 Chrome 应用商店。
- 官网按钮 2：下载离线安装包。

离线安装步骤：

1. 下载 `01kit-chrome.zip`。
2. 解压到本地文件夹。
3. 打开 `chrome://extensions`。
4. 启用开发者模式。
5. 点击“加载已解压的扩展程序”，选择解压后的目录。

安装包可以放在 Cloudflare Workers Static Assets。DNS 指向 `01kit-chrome.01mvp.com`，官网和下载文件都从同一个域名提供。

## 7. 这次协作留下的经验

- 需求文档可以先写大一点，但实现时要把 MVP 和后续增强拆清楚。
- Chrome 商店上架需要账号和素材，代码代理不能替你完成账号侧审核。
- 官网可以先放可下载包，商店链接等审核通过后再替换成真实地址。
- 调试插件时优先看 `chrome://extensions` 的错误和 Service Worker 日志。
- 涉及国内访问时，官网、安装包、教程和隐私说明要放在同一个可访问域名下。
