# 01Kit Chrome

01Kit 是一个本地优先的 Chrome 生产力插件，包含专注模式、网站屏蔽、时间统计、专注记录、每日目标、快捷键、通知和数据导出。

- 教程：[用 AI 开发一个 Chrome 插件](./docs/ai-chrome-extension-guide.md)
- 上架材料：[Chrome Web Store 上架材料](./docs/chrome-web-store-submission.md)
- 官网：`https://01kit-chrome.01mvp.com`
- 隐私说明：`https://01kit-chrome.01mvp.com/privacy`

## 本地开发

```bash
npm install
npm run dev
```

打开 `chrome://extensions`，启用开发者模式，加载 `.output/chrome-mv3`。

## 打包

```bash
npm run zip
```

打包文件会生成在 `.output/`。官网部署前会自动复制为 `site/public/downloads/01kit-chrome.zip`。

## 官网部署

```bash
npm run deploy:site
```

Cloudflare Worker 使用 `01kit-chrome.01mvp.com` 自定义域名。Chrome 应用商店上架后，把 `site/src/App.tsx` 里的 `storeUrl` 换成真实插件地址。

## 宣传片

```bash
npm run video:poster
npm run video
```

Remotion 源码在 `remotion/`，渲染结果会输出到 `site/public/media/`，官网首页会直接引用这个 MP4。

## 上架需要你配合的部分

- Chrome Web Store 开发者账号。
- 插件截图 3-5 张。
- 128x128 图标和宣传图。
- 商店描述与分类选择。
- 审核通过后的真实商店链接。
