const downloadUrl = "/downloads/01kit-chrome.zip";
const promoVideoUrl = "/media/01kit-promo.mp4";
const promoPosterUrl = "/media/01kit-promo-poster.png";
const storeUrl = "https://chromewebstore.google.com/search/01Kit";
const tutorialUrl = "/docs/ai-chrome-extension-guide.md";

export default function App() {
  if (window.location.pathname === "/privacy") {
    return <Privacy />;
  }

  return (
    <main>
      <header className="site-header">
        <nav aria-label="主导航">
          <a className="brand" href="/">
            <img src="/icon.svg" alt="" />
            <strong>01Kit</strong>
          </a>
          <div>
            <a href="#features">功能</a>
            <a href="#video">视频</a>
            <a href="#install">安装</a>
            <a href={tutorialUrl}>教程</a>
            <a href="/privacy">隐私</a>
          </div>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="hero-badge">
            <span>本地优先</span>
            <span>·</span>
            <span>零上传</span>
            <span>·</span>
            <span>开源</span>
          </div>
          <h1>专注时间<br/>不被打断</h1>
          <p className="hero-lead">
            一键屏蔽分心网站，自动记录时间分配。<br/>
            所有数据保存在浏览器本地，永不上传。
          </p>
          <div className="cta">
            <a className="primary" href={storeUrl} target="_blank" rel="noreferrer">
              <span>Chrome 应用商店安装</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a className="secondary" href={downloadUrl}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2V11M8 11L5 8M8 11L11 8M2 14H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>下载离线包</span>
            </a>
          </div>
        </div>

        <div className="product-shot" aria-label="01Kit 插件界面示意">
          <div className="browser-bar">
            <span />
            <span />
            <span />
          </div>
          <div className="mock-popup">
            <div className="mock-head">
              <span>01Kit</span>
              <div className="status-badge">专注中</div>
            </div>
            <div className="timer">18:42</div>
            <div className="progress">
              <span />
            </div>
            <div className="mock-actions">
              <span>暂停 5 分钟</span>
              <span>结束专注</span>
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
        <span>专注计时</span>
        <span>网站屏蔽</span>
        <span>时间统计</span>
        <span>本地数据</span>
      </section>

      <section className="video-section" id="video">
        <div>
          <p className="eyebrow">1 分钟了解</p>
          <h2>看完就会用</h2>
          <p>开启专注、屏蔽干扰、查看统计。无需注册，数据本地存储。</p>
        </div>
        <video controls playsInline preload="metadata" poster={promoPosterUrl}>
          <source src={promoVideoUrl} type="video/mp4" />
        </video>
      </section>

      <section className="features" id="features">
        <div className="features-header">
          <h2>核心功能</h2>
          <p>专注、屏蔽、统计，三个功能解决一个问题</p>
        </div>
        <div className="features-grid">
          <article className="feature-card feature-primary">
            <div className="feature-icon">🎯</div>
            <h3>专注计时</h3>
            <p>25/45/60 分钟预设，或自定义 1-240 分钟。一键开启，自动屏蔽分心网站。</p>
          </article>
          <article className="feature-card feature-primary">
            <div className="feature-icon">🚫</div>
            <h3>智能屏蔽</h3>
            <p>黑名单拦截干扰源，白名单保护工作流。专注期间自动生效，结束后恢复访问。</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>时间统计</h3>
            <p>按域名记录停留时间，支持日/周/月视图。窗口失焦不计时，数据真实可靠。</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>本地存储</h3>
            <p>所有数据保存在浏览器本地，不上传服务器。可排除敏感网站，一键清除记录。</p>
          </article>
        </div>
        <div className="dev-note">
          <span className="dev-badge">开发者</span>
          <p>想了解插件开发流程？查看<a href={tutorialUrl}>配套教程</a>，从产品设计到发布上架的完整实战。</p>
        </div>
      </section>

      <section className="privacy-band">
        <div>
          <p className="eyebrow">隐私承诺</p>
          <h2>数据不出浏览器</h2>
        </div>
        <p>
          01Kit 需要全站点权限来识别域名、统计时间和执行屏蔽规则。<strong>所有操作都在本地完成</strong>，不读取页面内容，不使用同步存储，不上传任何数据到服务器。你可以随时排除敏感网站或清除历史记录。
        </p>
      </section>

      <section className="install" id="install">
        <div>
          <p className="eyebrow">安装方式</p>
          <h2>两种安装方式</h2>
        </div>
        <div className="steps">
          <article>
            <span>1</span>
            <p>能访问 Chrome 应用商店时，直接从商店安装。</p>
          </article>
          <article>
            <span>2</span>
            <p>不能访问时，下载离线包，打开 <code>chrome://extensions</code>，启用开发者模式后加载解压目录。</p>
          </article>
        </div>
      </section>

      <footer>
        <span>01Kit by 01MVP</span>
        <a href={tutorialUrl}>AI 开发教程</a>
        <a href="/privacy">隐私说明</a>
      </footer>
    </main>
  );
}

function Privacy() {
  return (
    <main className="privacy">
      <a href="/">← 返回 01Kit</a>
      <h1>01Kit 隐私说明</h1>
      <p>01Kit 不上传你的浏览记录、专注记录或站点配置。</p>
      <p>插件使用 Chrome 本地存储保存时间统计、黑名单、白名单和偏好设置，不使用同步存储。</p>
      <p>全站点权限只用于在本地识别当前域名和执行屏蔽规则，不读取页面内容，也不会向外发送数据。</p>
      <p>你可以在插件设置页排除敏感网站，也可以清除全部统计数据。</p>
      <p>离线安装包托管在本站，下载行为可能会被 Cloudflare 按常规方式记录访问日志。</p>
    </main>
  );
}
