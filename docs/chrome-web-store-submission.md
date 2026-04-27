# 01Kit Chrome Web Store 上架资料

这份资料用于填写 Chrome Web Store Developer Dashboard。截图和宣传图已经按商店尺寸生成在 `output/chrome-web-store/`。

## 素材文件

**安装包**

运行：

```bash
npm run zip
```

上传 `npm run zip` 最新生成的 `.output/01kit-chrome-0.1-chrome.zip`。

**商店截图**

按这个顺序上传：

1. `output/chrome-web-store/01kit-01-start-focus.png`
2. `output/chrome-web-store/01kit-02-focus-running.png`
3. `output/chrome-web-store/01kit-03-blocked-page.png`
4. `output/chrome-web-store/01kit-04-rules.png`
5. `output/chrome-web-store/01kit-05-stats-records.png`

这些截图都是 `1280x800`。

**宣传图**

- 小宣传图：`output/chrome-web-store/01kit-small-promo-440x280.png`
- Marquee 宣传图：`output/chrome-web-store/01kit-marquee-promo-1400x560.png`
- 商店图标：`public/icon/icon-128.png`

**重新生成素材**

```bash
npm run store:assets
```

## Store Listing

**扩展名称**

01Kit

**一句话描述**

本地优先的 Chrome 专注插件，用专注计时、网站屏蔽和时间统计减少浏览器里的打扰。

**分类**

Productivity / 生产力

**语言**

中文（简体）

**官方网站**

https://01kit-chrome.01mvp.com

**隐私政策**

https://01kit-chrome.01mvp.com/privacy

**支持 URL**

https://github.com/makerjackie/01kit-chrome/issues

**详细描述**

01Kit 是一个本地优先的 Chrome 专注插件，适合想减少分心、了解自己浏览时间的人。

你可以开启 25、45、60 分钟专注，也可以自定义 1 到 240 分钟。专注开始后，01Kit 会按照你设置的黑名单或白名单屏蔽网站，并在访问被屏蔽页面时显示剩余时间。

主要功能：

- 专注计时：预设时长和自定义时长都支持。
- 网站屏蔽：支持黑名单和白名单两种模式。
- 临时暂停：需要处理临时事务时，可以暂停 1、5、15 分钟。
- 时间统计：按域名查看今日、本周、本月的访问时间。
- 专注记录：记录每次专注时长和完成情况。
- 数据导出：支持导出 CSV 和 JSON。

隐私说明：

01Kit 会在浏览器本地识别当前标签页域名，用于网站屏蔽和按域名聚合的时间统计。扩展不读取页面正文、表单内容、Cookie 或账号密码，不上传浏览记录、专注记录、黑名单、白名单或偏好设置。所有插件数据都保存在 Chrome 本地存储中。

权限说明：

- storage：在本地保存设置、专注记录和时间统计。
- tabs：识别当前标签页域名，用于时间统计和屏蔽规则判断。
- alarms：在 Manifest V3 Service Worker 中维持专注倒计时和统计节奏。
- idle：用户离开电脑时停止计时，避免虚增访问时间。
- notifications：专注结束时显示系统通知。
- declarativeNetRequest：在本地执行网站屏蔽规则。
- 全站点访问权限：用于识别任意网站的域名并执行用户设置的屏蔽规则，不读取页面内容，不上传数据。

## Privacy Practices

**Single purpose**

01Kit 的单一用途是帮助用户在 Chrome 中减少分心并理解自己的浏览时间。所有功能都围绕这一用途展开：开启专注、屏蔽网站、统计域名停留时间、查看专注记录和导出本地数据。

**Data usage**

建议按“处理网页浏览活动，但只保存在本地”的口径填写：

- Web browsing activity：是。扩展会在本地识别当前标签页域名，并按域名聚合停留时间。
- Website content：否。不读取页面正文、表单内容、图片、视频、Cookie 或账号密码。
- Personally identifiable information：否。
- Authentication information：否。
- Financial and payment information：否。
- Health information：否。
- Personal communications：否。
- Location：否。

**Data handling statements**

- 不出售用户数据。
- 不把用户数据用于广告或个性化广告。
- 不把用户数据转交给第三方。
- 不允许人工读取用户数据。
- 只把浏览器权限用于用户可见的专注计时、网站屏蔽、时间统计和数据导出。

**Remote code**

No. 01Kit 不执行远程代码，前端、后台脚本和样式都包含在扩展包内。

**Permission justifications**

| Permission | Justification |
| --- | --- |
| `storage` | 保存用户设置、专注会话、专注记录和按域名聚合的时间统计，数据只保存在本地浏览器。 |
| `tabs` | 获取当前活动标签页的 URL 域名，用于本地时间统计和屏蔽规则判断。 |
| `alarms` | 在 Manifest V3 Service Worker 中维持倒计时、暂停窗口和统计 tick。 |
| `idle` | 检测用户离开电脑的状态，避免把离开时间计入网站停留时间。 |
| `notifications` | 专注结束时显示系统通知。 |
| `declarativeNetRequest` | 根据用户设置的黑名单或白名单，在本地拦截或放行主页面请求。 |
| `<all_urls>` | 支持用户对任意网站设置屏蔽规则，并在本地识别当前域名做时间统计；不读取页面内容，不向服务器发送数据。 |

## Distribution

**Visibility**

Public

**Regions**

All regions

**Pricing**

Free

**Payment / in-app purchase**

不启用。

## Test Instructions

不需要测试账号。

建议填写：

```text
No account is required.

To test 01Kit:
1. Install the extension and open the popup.
2. Start a 1-minute or 25-minute focus session.
3. Keep blacklist mode enabled and add a distracting domain such as youtube.com.
4. Open that domain in a tab. The extension should show the 01Kit blocked page.
5. Use the temporary pause buttons to allow access for 1, 5, or 15 minutes.
6. Open the options page to review blacklist, whitelist, time statistics, focus records, and CSV/JSON export.

All data is stored locally in Chrome storage. No server account or external API is used.
```

## 提交前检查

- `npm run check` 通过。
- `npm run store:assets` 已生成最新截图。
- `npm run zip` 已生成最新安装包。
- 隐私政策页面可以访问：`https://01kit-chrome.01mvp.com/privacy`。
- Store Listing、Privacy Practices、官网和扩展功能描述一致。
- 最终点击 `Submit for review` 前，确认使用的是正确 Google 开发者账号。

## 参考

- Chrome Web Store 上架流程：https://developer.chrome.com/docs/webstore/publish
- Store Listing 字段：https://developer.chrome.com/docs/webstore/cws-dashboard-listing
- 隐私字段：https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- 图片尺寸要求：https://developer.chrome.com/docs/webstore/images
- 分发设置：https://developer.chrome.com/docs/webstore/cws-dashboard-distribution
