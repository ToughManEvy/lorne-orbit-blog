const DEFAULT_ARTICLES = [
  {
    id: 1,
    category: "心情日记",
    date: "2026年7月16日 20:30",
    title: "晚风替我翻过一页书",
    excerpt: "天色慢慢暗下来的时候，窗外的树影落在书页上。我忽然觉得，寻常的一天也有值得郑重收藏的部分。",
    lead: "人总要在忙碌的缝隙里，给自己留一点不必解释的安静。",
    body: "傍晚下过一阵很轻的雨。推开窗，潮湿的风吹进来，把桌上的书翻过一页。那一刻我没有急着合上它，只看着纸张微微起伏，像有人替我读完了迟迟没有读完的句子。\n\n楼下卖花的人已经收摊，路灯刚刚亮起。生活似乎总在这些不经意的时刻露出柔软的一面。它没有说什么大道理，只提醒我：今天虽然普通，却也真实地来过。",
    featured: true
  },
  {
    id: 2,
    category: "杂谈集",
    date: "2026年7月11日 09:15",
    title: "为什么我们仍需要写点什么",
    excerpt: "文字不一定要抵达远方。很多时候，它只是帮助我们在飞快的时间里，认出曾经的自己。",
    lead: "写作像在时间里钉下一枚小小的书签。",
    body: "有些日子过得很快，快到来不及分辨其中的喜悦与疲惫。等我们回过头，它们已经连成模糊的一片。\n\n于是我开始写。写清晨的第一班车，写一场没有预告的雨，也写某句话突然带来的勇气。不是为了证明生活多么特别，而是不想让那些细小的感受轻易消失。"
  },
  {
    id: 3,
    category: "往事如烟",
    date: "2026年6月28日 18:40",
    title: "外婆家的旧木窗",
    excerpt: "很多年后，我仍记得那扇木窗被夏日照亮的样子，蝉声很长，蒲扇摇出的风很慢。",
    lead: "记忆里的夏天，总比后来遇见的更漫长。",
    body: "外婆家的木窗有一点歪，推开时总会发出很轻的吱呀声。窗外是一棵枣树，枝叶挨得很近，风吹过时就在窗框上投下斑驳的影子。\n\n那时不懂得怀念，只觉得午后永远不会结束。如今再想起来，最舍不得的不是某件具体的旧物，而是那个相信日子可以一直慢下去的自己。"
  },
  {
    id: 4,
    category: "逆水行舟",
    date: "2026年6月20日 22:10",
    title: "把难走的路，走成自己的路",
    excerpt: "成长大概不是从此不再害怕，而是害怕的时候，也知道下一步应该落在哪里。",
    lead: "慢一点没有关系，只要每一步都还朝着想去的方向。",
    body: "曾经以为努力应该伴随着轰轰烈烈的改变，后来才明白，真正的坚持往往安静得无人知晓。\n\n它可能只是清晨早起的一小时，是失败之后重新打开的文档，是在怀疑自己时仍愿意再试一次。那些看起来没有回声的日子，终会在某个时刻连成通往远方的路。"
  },
  {
    id: 5,
    category: "心情日记",
    date: "2026年6月9日 16:25",
    title: "六月的雨落得很轻",
    excerpt: "咖啡凉了一半，雨还没有停。索性不再等晴天，把这段安静当作今日额外的礼物。",
    lead: "下雨天适合把时间折起来，放进一本旧书里。",
    body: "雨从中午开始下，到了傍晚还是细细密密的。街上的人撑着不同颜色的伞，走得比平时更慢。\n\n我坐在窗边，看玻璃上的水痕不断改变方向。原本安排好的事情被打乱，却意外得到一个可以发呆的下午。有时生活关上一扇门，只是想让我们留意窗外。"
  },
  {
    id: 6,
    category: "杂谈集",
    date: "2026年5月25日 21:05",
    title: "独处不是一座孤岛",
    excerpt: "当一个人不再急着用热闹填满空白，独处就会从荒岛变成一间有灯的屋子。",
    lead: "和自己相处，也是一种需要慢慢练习的能力。",
    body: "我们常常害怕安静，因为安静会让那些被忽略的念头变得清晰。可真正习惯之后，独处并不意味着与世界断开。\n\n它更像一次整理：把别人的期待放回原处，把自己的声音从嘈杂中重新找出来。等灯亮起，你会发现这间屋子并不冷清。"
  },
  {
    id: 7,
    category: "往事如烟",
    date: "2026年5月8日 10:30",
    title: "那年站台，绿皮火车",
    excerpt: "汽笛响起时，我们都以为下一次见面不会太远，却不知道有些告别要用很多年才能读懂。",
    lead: "站台擅长收藏告别，也擅长让人相信重逢。",
    body: "旧车站的广播带着轻微的杂音，行李箱的轮子在地面上发出断断续续的声响。那一天阳光很好，所有告别的话都显得多余。\n\n后来坐过更快的车，去过更远的地方，却总会想起那列慢慢驶出视线的绿皮火车。我们挥着手，以为只是一个普通的下午。"
  },
  {
    id: 8,
    category: "逆水行舟",
    date: "2026年4月19日 23:15",
    title: "允许自己慢一点抵达",
    excerpt: "别人的花期不是你的时钟。照顾好脚下的土地，属于你的春天自会有它的消息。",
    lead: "人生不是一场需要同时起跑的竞赛。",
    body: "看见别人走得很快时，我们很容易怀疑自己的方向。可每个人背着不同的行囊，也走在不同的地形上。\n\n不必因为暂时没有结果，就否定那些扎根的日子。允许自己绕路，允许自己停下来喘口气。所谓抵达，从来不只有一种模样。"
  }
];

const articleGrid = document.querySelector("#article-grid");
const featuredSlot = document.querySelector("#featured-slot");
const articleCount = document.querySelector("#article-count");
const emptyState = document.querySelector("#empty-state");
const searchDialog = document.querySelector("#search-dialog");
const searchInput = document.querySelector("#search-input");
const searchResults = document.querySelector("#search-results");
const loginDialog = document.querySelector("#login-dialog");
const deleteDialog = document.querySelector("#delete-dialog");
const toast = document.querySelector("#toast");
const localMessageList = document.querySelector("#local-message-list");
const COMMENT_PROFILE_KEY = "lorne-orbit-comment-profile";
const CUSTOM_POSTS_KEY = "lorne-orbit-custom-posts";
const POST_STATE_KEY = "lorne-orbit-post-state";
const POST_IMAGES_KEY = "lorne-orbit-post-images";
const LEGACY_MIGRATION_KEY = "lorne-orbit-server-migration-complete";
const ARTICLE_CACHE_KEY = "lorne-orbit-public-post-cache-v1";

let activeCategory = "全部";
let currentPage = 1;
let articles = [];
let allArticles = [];
let serverMessages = [];
let adminAuthenticated = false;
let pendingImageUploads = 0;
let editingPostId = null;
let messageSubmitInFlight = false;
let messageDraftRequest = null;
let articleLoadError = null;
let articleReloadTimer = null;
const commentsByArticle = new Map();
const PAGE_SIZE = 9;

function showToast(message, duration = 2600) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

function isAdmin() {
  return adminAuthenticated;
}

function readJSONStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function getCustomPosts() {
  const posts = readJSONStorage(CUSTOM_POSTS_KEY, []);
  return Array.isArray(posts) ? posts : [];
}

function getPostState() {
  const state = readJSONStorage(POST_STATE_KEY, {});
  return state && typeof state === "object" && !Array.isArray(state) ? state : {};
}

function getPostImages() {
  const images = readJSONStorage(POST_IMAGES_KEY, {});
  return images && typeof images === "object" && !Array.isArray(images) ? images : {};
}

function resolveLocalImages(source) {
  const images = getPostImages();
  return String(source).replace(/\]\(local-image:\/\/([^)]+)\)/g, (match, id) => {
    const image = images[id];
    return image?.data ? `](${image.data})` : match;
  });
}

function getAllArticleRecords() {
  return allArticles;
}

async function refreshArticles() {
  const payload = await blogApi.getPosts(isAdmin());
  allArticles = payload.posts;
  articles = allArticles.filter((article) => isAdmin() || !article.hidden);
  if (!isAdmin()) writeArticleCache(articles);
}

function readArticleCache() {
  const cached = readJSONStorage(ARTICLE_CACHE_KEY, null);
  return Array.isArray(cached?.posts) ? cached.posts : [];
}

function writeArticleCache(posts) {
  try {
    localStorage.setItem(ARTICLE_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), posts }));
  } catch {
    // A fresh network response still works when storage is full or unavailable.
  }
}

function getLocalMessages() {
  return serverMessages;
}

function createClientRequestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 3) | 8;
    return value.toString(16);
  });
}

function renderLocalMessages() {
  const messages = getLocalMessages();
  localMessageList.replaceChildren();
  if (!messages.length) {
    const empty = document.createElement("p");
    empty.className = "no-local-message";
    empty.textContent = "这里还没有留言，第一句话可以从今天开始。";
    localMessageList.append(empty);
    return;
  }
  const summary = document.createElement("p");
  summary.className = "message-list-summary";
  summary.textContent = `共 ${messages.length} 条留言`;
  localMessageList.append(summary);
  messages.forEach((message) => {
    const item = document.createElement("div");
    item.className = "saved-message";
    const text = document.createElement("p");
    text.textContent = message.text;
    const metaLine = document.createElement("small");
    metaLine.textContent = `${message.name} · ${message.date}`;
    const remove = document.createElement("button");
    if (isAdmin()) {
      remove.className = "delete-message";
      remove.type = "button";
      remove.dataset.deleteMessage = message.id;
      remove.setAttribute("aria-label", `删除${message.name}的留言`);
      remove.textContent = "×";
      item.append(text, metaLine, remove);
    } else {
      item.append(text, metaLine);
    }
    localMessageList.append(item);
  });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function fallbackMarkdown(source) {
  let html = escapeHTML(source);
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/!\[([^\]]*)\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/==(.+?)==/g, "<mark>$1</mark>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^(?:- |\* )(.+)$/gm, "<li>$1</li>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>");
  return `<p>${html}</p>`.replace(/<p>\s*(<h[1-3]>)/g, "$1").replace(/(<\/h[1-3]>)\s*<\/p>/g, "$1");
}

let markdownExtensionsConfigured = false;

function configureMarkdownExtensions() {
  if (markdownExtensionsConfigured || !window.marked?.use) return;
  window.marked.use({
    extensions: [{
      name: "highlight",
      level: "inline",
      start(source) {
        const index = source.indexOf("==");
        return index < 0 ? undefined : index;
      },
      tokenizer(source) {
        const match = /^==(?=\S)([\s\S]*?\S)==/.exec(source);
        if (!match) return undefined;
        return { type: "highlight", raw: match[0], tokens: this.lexer.inlineTokens(match[1]) };
      },
      renderer(token) {
        return `<mark>${this.parser.parseInline(token.tokens)}</mark>`;
      }
    }]
  });
  markdownExtensionsConfigured = true;
}

function renderMarkdown(source) {
  const resolvedSource = resolveLocalImages(source);
  if (window.marked?.parse && window.DOMPurify?.sanitize) {
    configureMarkdownExtensions();
    return window.DOMPurify.sanitize(window.marked.parse(resolvedSource, { gfm: true, breaks: true }), { ADD_ATTR: ["target"] });
  }
  return fallbackMarkdown(resolvedSource);
}

function plainTextFromMarkdown(source) {
  const container = document.createElement("div");
  container.innerHTML = renderMarkdown(source);
  return (container.textContent || "").replace(/\s+/g, " ").trim();
}

function getLocalComments() {
  return [...commentsByArticle.values()].flat();
}

function renderComments(articleId) {
  const article = articles.find((item) => item.id === articleId);
  const comments = getLocalComments().filter((comment) => comment.articleId === articleId);
  const count = document.querySelector("#comment-count");
  const list = document.querySelector("#comment-list");
  if (!article || !count || !list) return;
  count.textContent = `${comments.length} 个评论 在 “${article.title}”`;

  const renderBranch = (parentId = null, depth = 0) => {
    const branch = comments.filter((comment) => (comment.parentId || null) === parentId);
    if (!branch.length) return "";
    return `<ol class="${depth ? "comment-children" : "comment-list-root"}">${branch.map((comment) => `
      <li class="comment-item" id="comment-${comment.id}">
        <article class="comment-card">
          <div class="comment-avatar" aria-hidden="true">${escapeHTML(comment.name.slice(0, 1).toUpperCase())}</div>
          <div class="comment-content">
            <header><strong>${escapeHTML(comment.name)}${comment.isAdmin ? " 🧸" : ""}</strong>${comment.isAdmin ? '<span class="comment-admin-badge">管理员</span>' : ""}<span>说道：</span></header>
            <time>${escapeHTML(comment.date)}</time>
            <p>${escapeHTML(comment.text).replace(/\n/g, "<br>")}</p>
            <button type="button" data-reply-comment="${comment.id}">回复</button>
          </div>
        </article>
        ${renderBranch(comment.id, depth + 1)}
      </li>`).join("")}</ol>`;
  };

  list.innerHTML = comments.length ? renderBranch() : '<p class="no-comments">还没有评论，来写下第一条回复吧。</p>';
}

const meta = (article) => `
  <div class="article-meta">
    <span>${article.category}</span><span class="dash"></span><time>${article.date}</time>
  </div>`;

function excerptFromBody(article, length) {
  const text = article.isMarkdown ? plainTextFromMarkdown(article.body) : article.body.replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length).trimEnd()} […]` : text;
}

function renderArticles(category = "全部") {
  const filtered = category === "全部" ? articles : articles.filter((item) => item.category === category);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  articleCount.textContent = filtered.length;
  emptyState.hidden = visible.length > 0;
  if (!visible.length) {
    emptyState.querySelector("h3").textContent = articleLoadError ? "正在等待文章服务器" : "没有找到这篇文字";
    emptyState.querySelector("p").textContent = articleLoadError
      ? "服务器恢复后会自动载入你的文章，无需刷新页面。"
      : "换个关键词试试吧，或许它正藏在另一页里。";
  }

  const lead = visible[0];
  featuredSlot.innerHTML = lead ? `
    <article class="featured-article">
      <div class="featured-body">
        ${meta(lead)}
        <h3><button class="article-title-link" type="button" data-read="${lead.id}">${lead.title}</button></h3>
        <p class="article-excerpt">${excerptFromBody(lead, 110)}</p>
        <button class="read-more" type="button" data-read="${lead.id}">阅读全文</button>
      </div>
    </article>` : "";

  articleGrid.innerHTML = visible.slice(1).map((article, index) => `
    <article class="article-card" style="animation-delay:${500 + index * 60}ms">
      ${meta(article)}
      <h3><button class="article-title-link" type="button" data-read="${article.id}">${article.title}</button></h3>
      <p class="article-excerpt">${excerptFromBody(article, 70)}</p>
      <button class="read-more" type="button" data-read="${article.id}">阅读全文</button>
    </article>`).join("");
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const pagination = document.querySelector("#pagination");
  const numbers = document.querySelector("#page-numbers");
  pagination.hidden = totalPages <= 1;
  numbers.innerHTML = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    return `<button type="button" class="page-number${page === currentPage ? " current" : ""}" data-page="${page}" aria-label="第 ${page} 页"${page === currentPage ? ' aria-current="page"' : ""}>${page}</button>`;
  }).join("");
  document.querySelector("#prev-page").disabled = currentPage === 1;
  document.querySelector("#next-page").disabled = currentPage === totalPages;
}

function renderArchive() {
  const groups = articles.reduce((result, article) => {
    const year = article.date.match(/\d{4}/)?.[0] || "未注明";
    (result[year] ||= []).push(article);
    return result;
  }, {});
  const years = Object.keys(groups).sort((a, b) => Number(b) - Number(a));
  document.querySelector("#archive-years").innerHTML = years.map((year, index) => `
    ${index ? '<span aria-hidden="true">•</span>' : ""}
    <button type="button" data-archive-year="${year}">${year}</button>`).join("");
  document.querySelector("#archive-groups").innerHTML = years.map((year) => `
    <section class="archive-year-group" id="archive-year-${year}">
      <h3>${year} <span>(${groups[year].length})</span></h3>
      <ul>
        ${groups[year].map((article) => {
          const date = article.date.match(/(\d{1,2})月(\d{1,2})日(?:\s+(\d{2}:\d{2}))?/);
          const shortDate = date ? `${date[1].padStart(2, "0")}月${date[2].padStart(2, "0")}日${date[3] ? ` ${date[3]}` : ""}` : article.date;
          return `<li>
            <time>${shortDate}</time><span class="archive-colon">：</span>
            <button type="button" data-read="${article.id}">${article.title}</button>
            <span class="archive-category">(${article.category})</span>
          </li>`;
        }).join("")}
      </ul>
    </section>`).join("");
}

function articleGalleryImages() {
  const seen = new Set();
  const images = [];
  articles.forEach((article) => {
    if (!article.isMarkdown) return;
    const rendered = document.createElement("div");
    rendered.innerHTML = renderMarkdown(article.body || "");
    rendered.querySelectorAll("img[src]").forEach((image) => {
      const source = image.getAttribute("src")?.trim();
      if (!source || seen.has(source)) return;
      seen.add(source);
      images.push({
        source,
        alt: image.getAttribute("alt")?.trim() || `${article.title}中的图片`,
        articleId: article.id,
        articleTitle: article.title,
        articleDate: article.date
      });
    });
  });
  return images;
}

function renderGallery() {
  const gallery = articleGalleryImages();
  const grid = document.querySelector("#gallery-grid");
  const empty = document.querySelector("#gallery-empty");
  document.querySelector("#gallery-summary").textContent = articleLoadError
    ? "正在等待文章服务器，恢复后会自动整理图片"
    : gallery.length
    ? `从 ${articles.length} 篇博客中收集了 ${gallery.length} 张图片`
    : `已浏览 ${articles.length} 篇博客，暂时还没有图片`;
  empty.hidden = gallery.length > 0;
  grid.innerHTML = gallery.map((image, index) => `
    <figure class="gallery-item" style="animation-delay:${Math.min(index * 45, 450)}ms">
      <a class="gallery-image-link" href="${escapeHTML(image.source)}" target="_blank" rel="noopener noreferrer" aria-label="查看大图：${escapeHTML(image.alt)}">
        <img src="${escapeHTML(image.source)}" alt="${escapeHTML(image.alt)}" loading="lazy" decoding="async">
      </a>
      <figcaption>
        <button type="button" data-read="${image.articleId}">${escapeHTML(image.articleTitle)}</button>
        <time>${escapeHTML(image.articleDate)}</time>
      </figcaption>
    </figure>`).join("");
}

function renderAdminTools() {
  const loggedIn = isAdmin();
  document.querySelector("#admin-login-button").hidden = loggedIn;
  document.querySelector("#admin-session-tools").hidden = !loggedIn;
  const migrationButton = document.querySelector("#legacy-migrate-button");
  const migrationDone = localStorage.getItem(LEGACY_MIGRATION_KEY) === window.BLOG_CONFIG?.API_URL;
  const hasLegacyPosts = getCustomPosts().length > 0;
  migrationButton.hidden = !loggedIn || migrationDone || (!hasLegacyPosts && allArticles.length > 0);
  document.body.classList.toggle("admin-authenticated", loggedIn);
}

function updateMarkdownPreview() {
  const editor = document.querySelector("#markdown-editor");
  const preview = document.querySelector("#markdown-preview");
  if (!editor || !preview) return;
  preview.innerHTML = editor.value.trim() ? renderMarkdown(editor.value) : '<p class="preview-placeholder">预览将在这里出现。</p>';
}

function renderManagePosts() {
  const records = getAllArticleRecords();
  const hiddenCount = records.filter((article) => article.hidden).length;
  document.querySelector("#manage-summary").innerHTML = `<span>共 ${records.length} 篇文章</span><span>${hiddenCount} 篇仅管理员可见</span>`;
  document.querySelector("#manage-post-list").innerHTML = records.length ? records.map((article) => `
    <article class="manage-post-row${article.hidden ? " is-hidden" : ""}">
      <div class="manage-post-main">
        <p><span>${escapeHTML(article.category)}</span><time>${escapeHTML(article.date)}</time>${article.hidden ? '<em>已隐藏</em>' : ""}</p>
        <h3><button type="button" data-manage-open="${article.id}">${escapeHTML(article.title)}</button></h3>
        <small>${article.isCustom ? "本地发布文章" : "内置文章"}</small>
      </div>
      <div class="manage-actions">
        <button type="button" data-edit-post="${article.id}">编辑</button>
        <button type="button" data-toggle-hidden="${article.id}">${article.hidden ? "对游客显示" : "对游客隐藏"}</button>
        <button class="danger" type="button" data-delete-post="${article.id}">删除</button>
      </div>
    </article>`).join("") : '<p class="manage-empty">目前没有文章。</p>';
}

async function updatePostState(id, changes) {
  await blogApi.updatePost(id, changes);
}

async function refreshAllArticleViews() {
  await refreshArticles();
  renderArchive();
  renderManagePosts();
  if (document.body.dataset.view === "home" || document.body.dataset.view === "articles") {
    renderArticles(document.body.dataset.view === "home" ? "全部" : activeCategory);
  }
}

function resetPostEditor() {
  editingPostId = null;
  const form = document.querySelector("#post-editor-form");
  form.reset();
  document.querySelector("#write-title").textContent = "撰写新的博客";
  document.querySelector("#post-editor-submit").textContent = "发布博客";
  document.querySelector("#editor-cancel-button").hidden = true;
  document.querySelector("#editor-submit-hint").textContent = "文章保存到数据库，图片保存到云端对象存储。";
  updateMarkdownPreview();
}

function editPost(id) {
  const article = getAllArticleRecords().find((item) => item.id === Number(id));
  if (!article) {
    showToast("找不到需要修改的文章。", 2600);
    return;
  }
  editingPostId = article.id;
  const form = document.querySelector("#post-editor-form");
  form.elements.title.value = article.title;
  form.elements.category.value = article.category;
  form.elements.body.value = article.body;
  document.querySelector("#write-title").textContent = "修改已发布的博客";
  document.querySelector("#post-editor-submit").textContent = "保存修改";
  document.querySelector("#editor-cancel-button").hidden = false;
  document.querySelector("#editor-submit-hint").textContent = `正在修改《${article.title}》，发布时间和评论不会改变。`;
  updateMarkdownPreview();
  location.hash = "write";
  setTimeout(() => form.elements.title.focus(), 80);
}

function insertAtEditorCursor(before, after = "") {
  const editor = document.querySelector("#markdown-editor");
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const selected = editor.value.slice(start, end);
  editor.setRangeText(`${before}${selected}${after}`, start, end, "end");
  editor.focus();
  updateMarkdownPreview();
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法读取图片"));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("图片压缩失败")),
    "image/webp",
    quality
  ));
}

async function optimizeImage(file) {
  if (file.type === "image/gif") {
    if (file.size > 4 * 1024 * 1024) throw new Error("GIF 图片不能超过 4MB");
    return file;
  }
  if (/^image\/(?:jpeg|png|webp)$/.test(file.type) && file.size <= 700 * 1024) return file;

  const image = window.createImageBitmap ? await createImageBitmap(file) : await loadImageFile(file);
  const width = image.width || image.naturalWidth;
  const height = image.height || image.naturalHeight;
  const scale = Math.min(1, 1600 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close?.();
  let blob = await canvasToBlob(canvas, .8);
  if (blob.size > 3.8 * 1024 * 1024) blob = await canvasToBlob(canvas, .68);
  if (blob.size >= file.size && file.size <= 4 * 1024 * 1024) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
}

function imageAltText(file) {
  return file.name.replace(/\.[^.]+$/, "").replace(/[\[\]]/g, "") || "文章图片";
}

function isImageFile(file) {
  return Boolean(file) && (
    file.type.startsWith("image/") ||
    /\.(?:avif|bmp|gif|heic|heif|jpe?g|png|webp)$/i.test(file.name)
  );
}

function clipboardImageFiles(clipboardData) {
  const files = [
    ...(clipboardData?.files || []),
    ...[...(clipboardData?.items || [])]
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
  ].filter(isImageFile);
  const seen = new Set();
  return files.filter((file) => {
    const key = `${file.name}:${file.type}:${file.size}:${file.lastModified}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function readClipboardImages() {
  if (!navigator.clipboard?.read) return [];
  const clipboardItems = await navigator.clipboard.read();
  const files = [];
  for (const item of clipboardItems) {
    const imageType = item.types.find((type) => type.startsWith("image/"));
    if (!imageType) continue;
    const blob = await item.getType(imageType);
    const extension = imageType.split("/")[1].replace("jpeg", "jpg").replace(/[^a-z0-9]/gi, "") || "png";
    files.push(new File([blob], `clipboard-${Date.now()}-${files.length + 1}.${extension}`, { type: imageType }));
  }
  return files;
}

async function readImagesFromClipboardHtml(html) {
  if (!html) return [];
  const documentFragment = new DOMParser().parseFromString(html, "text/html");
  const sources = [...documentFragment.querySelectorAll("img[src]")]
    .map((image) => image.getAttribute("src"))
    .filter((source) => /^(?:data:image\/|https?:\/\/)/i.test(source))
    .slice(0, 10);
  const results = await Promise.allSettled(sources.map(async (source, index) => {
    const response = await fetch(source);
    if (!response.ok) throw new Error("无法读取剪贴板中的图片地址");
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) throw new Error("剪贴板内容不是图片");
    const extension = blob.type.split("/")[1].replace("jpeg", "jpg").replace(/[^a-z0-9]/gi, "") || "png";
    return new File([blob], `clipboard-${Date.now()}-${index + 1}.${extension}`, { type: blob.type });
  }));
  return results.filter((result) => result.status === "fulfilled").map((result) => result.value);
}

function replaceEditorUploadMarker(marker, replacement) {
  const editor = document.querySelector("#markdown-editor");
  if (!editor.value.includes(marker)) return false;
  const selectionStart = editor.selectionStart;
  const selectionEnd = editor.selectionEnd;
  const markerStart = editor.value.indexOf(marker);
  const delta = replacement.length - marker.length;
  editor.value = editor.value.replace(marker, replacement);
  if (document.activeElement === editor) {
    const adjust = (position) => position > markerStart ? Math.max(markerStart + replacement.length, position + delta) : position;
    editor.setSelectionRange(adjust(selectionStart), adjust(selectionEnd));
  }
  updateMarkdownPreview();
  return true;
}

async function insertAndUploadImages(files) {
  const images = [...files].filter(isImageFile);
  if (!images.length) return;

  const uploads = images.map((file) => {
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return { file, alt: imageAltText(file), marker: `<!-- image-upload:${id} -->` };
  });
  insertAtEditorCursor(`\n${uploads.map(({ marker }) => marker).join("\n")}\n`);
  pendingImageUploads += uploads.length;
  document.querySelector('#post-editor-form button[type="submit"]').disabled = true;
  showToast(images.length > 1 ? `正在上传 ${images.length} 张图片…` : "正在上传图片…", 60000);

  const results = await Promise.allSettled(uploads.map(async ({ file, alt, marker }) => {
    try {
      const uploadFile = await optimizeImage(file);
      const uploaded = await blogApi.uploadImage(uploadFile);
      replaceEditorUploadMarker(marker, `![${alt}](${uploaded.url})`);
      return true;
    } catch (error) {
      replaceEditorUploadMarker(marker, `<!-- 图片上传失败：${alt} -->`);
      throw error;
    }
  }));
  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length) {
    showToast(failed[0].reason?.message || `${failed.length} 张图片上传失败，请重试。`, 4200);
  } else {
    showToast(images.length > 1 ? `${images.length} 张图片已插入正文。` : "图片已插入正文。", 2600);
  }
  pendingImageUploads -= uploads.length;
  document.querySelector('#post-editor-form button[type="submit"]').disabled = pendingImageUploads > 0;
}

async function applyView() {
  const requestedHash = location.hash.replace("#", "");
  const requested = requestedHash === "about" ? "gallery" : requestedHash;
  const isPost = requested.startsWith("post-");
  const isAdminPage = ["write", "manage"].includes(requested);
  if (isAdminPage && !isAdmin()) {
    document.body.dataset.view = "home";
    if (!loginDialog.open) loginDialog.showModal();
    return;
  }
  const view = isPost ? "post" : (["articles", "message", "gallery", "write", "manage"].includes(requested) ? requested : "home");
  document.body.dataset.view = view;
  currentPage = 1;
  document.querySelectorAll('.top-nav a, .journal-nav a').forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${view}`);
  });
  if (view === "post") {
    await renderSinglePost(Number(requested.replace("post-", "")));
  } else if (view === "write") {
    document.title = "撰写博客 – Lorne's orbit";
    updateMarkdownPreview();
  } else if (view === "manage") {
    document.title = "文章管理 – Lorne's orbit";
    renderManagePosts();
  } else if (view === "gallery") {
    document.title = "博客相册 – Lorne's orbit";
    renderGallery();
  } else {
    document.title = "Lorne's orbit · 个人博客";
    renderArticles(view === "home" ? "全部" : activeCategory);
  }
  window.scrollTo(0, 0);
  const floatingNav = document.querySelector("#floating-nav");
  floatingNav.classList.remove("show");
  floatingNav.setAttribute("aria-hidden", "true");
}

function openArticle(id) {
  const article = articles.find((item) => item.id === Number(id));
  if (!article) return;
  location.hash = `post-${article.id}`;
}

async function renderSinglePost(id) {
  const article = articles.find((item) => item.id === id);
  if (!article) {
    location.hash = "home";
    return;
  }
  const index = articles.findIndex((item) => item.id === id);
  const previous = articles[index + 1];
  const next = articles[index - 1];
  const adminCommenting = isAdmin();
  const paragraphs = article.isMarkdown ? renderMarkdown(article.body) : article.body.split(/\n{2,}/).map((paragraph) => `<p>${paragraph}</p>`).join("");
  document.title = `${article.title} – Lorne's orbit`;
  document.querySelector("#single-post").innerHTML = `
    <article class="single-post-inner">
      <nav class="post-breadcrumb" aria-label="面包屑导航">
        <a href="#home">首页</a><span>›</span><span>${article.title}</span>
      </nav>
      <header class="post-header">
        <p class="post-category">${article.category}${article.hidden && isAdmin() ? ' · <span class="admin-hidden-label">仅管理员可见</span>' : ""}</p>
        <h1>${article.title}</h1>
        <p class="post-meta"><span>Lorne's orbit</span><time>${article.date}</time></p>
      </header>
      <div class="post-body">
        ${article.isMarkdown ? "" : `<p class="post-lead">${article.lead}</p>`}
        ${paragraphs}
      </div>
      <div class="post-footer-meta">
        <span>分类：</span><button type="button" data-post-category="${article.category}">${article.category}</button>
      </div>
      <aside class="post-author">
        <div class="author-mark" aria-hidden="true">L</div>
        <div><strong>Lorne's orbit</strong><p>一个野心勃勃，一个向自我生长的浩瀚新论</p></div>
      </aside>
      <nav class="post-navigation" aria-label="文章导航">
        <div>${previous ? `<small>上一篇文章</small><button type="button" data-read="${previous.id}">← ${previous.title}</button>` : ""}</div>
        <div>${next ? `<small>下一篇文章</small><button type="button" data-read="${next.id}">${next.title} →</button>` : ""}</div>
      </nav>
      <section class="comments-area" data-comment-article="${article.id}" aria-labelledby="comment-count">
        <button class="comment-compose-toggle" type="button" aria-expanded="false" aria-controls="comment-form-panel">
          <span>发表回复</span><span class="toggle-mark" aria-hidden="true">＋</span>
        </button>
        <div class="comment-form-panel" id="comment-form-panel">
          <div class="comment-form-clip">
            <form class="comment-form" id="comment-form" data-parent-id="">
              <div class="comment-form-heading">
                <h2>发表回复</h2>
                <p>${adminCommenting ? "将以管理员 Lorne 的身份发表。" : "您的邮箱地址不会被公开。必填项已用 * 标注"}</p>
              </div>
              <p class="replying-to" id="replying-to" hidden>正在回复 <strong></strong><button type="button" data-cancel-reply>取消回复</button></p>
              <label class="comment-field comment-field-wide">
                <span>评论 *</span>
                <textarea name="comment" rows="9" maxlength="1200" required></textarea>
              </label>
              ${adminCommenting ? "" : `
                <div class="comment-form-row">
                  <label class="comment-field"><span>显示名称 *</span><input type="text" name="name" maxlength="40" required /></label>
                  <label class="comment-field"><span>邮箱 *</span><input type="email" name="email" maxlength="100" required /></label>
                </div>
                <label class="comment-remember"><input type="checkbox" name="remember" /> <span>在此浏览器中保存我的显示名称和邮箱地址，以便下次评论时使用。</span></label>`}
              <button class="comment-submit" type="submit">发表评论</button>
            </form>
          </div>
        </div>
        <h2 class="comments-title" id="comment-count"></h2>
        <div id="comment-list"></div>
      </section>
    </article>`;
  try {
    const profile = JSON.parse(localStorage.getItem(COMMENT_PROFILE_KEY) || "null");
    if (profile && !adminCommenting) {
      const form = document.querySelector("#comment-form");
      form.elements.name.value = profile.name || "";
      form.elements.email.value = profile.email || "";
      form.elements.remember.checked = true;
    }
  } catch {}
  try {
    const payload = await blogApi.getComments(article.id);
    commentsByArticle.set(article.id, payload.comments);
  } catch (error) {
    commentsByArticle.set(article.id, []);
    showToast(error.message || "评论加载失败");
  }
  renderComments(article.id);
}

function renderSearch(query = "") {
  const keyword = query.trim().toLowerCase();
  if (!keyword) {
    searchResults.innerHTML = '<p class="search-hint">可搜索文章标题、分类或正文内容</p>';
    return;
  }
  const result = articles.filter((article) =>
    [article.title, article.category, article.excerpt, article.body].join(" ").toLowerCase().includes(keyword)
  );
  searchResults.innerHTML = result.length ? result.map((article) => `
    <button class="search-result" type="button" data-search-read="${article.id}">
      <span><strong>${article.title}</strong><small>${article.category}</small></span>
      <span>→</span>
    </button>`).join("") : '<p class="search-hint">没有找到相关文字，换个词试试吧。</p>';
}

document.querySelector(".category-tabs").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  currentPage = 1;
  document.querySelectorAll(".category-tabs button").forEach((item) => item.classList.toggle("active", item === button));
  renderArticles(activeCategory);
});

document.querySelector("#pagination").addEventListener("click", (event) => {
  const number = event.target.closest("[data-page]");
  const prev = event.target.closest("#prev-page");
  const next = event.target.closest("#next-page");
  if (number) currentPage = Number(number.dataset.page);
  if (prev && !prev.disabled) currentPage -= 1;
  if (next && !next.disabled) currentPage += 1;
  if (!number && !prev && !next) return;
  renderArticles(document.body.dataset.view === "home" ? "全部" : activeCategory);
  document.querySelector("#articles").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelector("#articles").addEventListener("click", (event) => {
  const yearButton = event.target.closest("[data-archive-year]");
  if (yearButton) {
    document.querySelector(`#archive-year-${yearButton.dataset.archiveYear}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const button = event.target.closest("[data-read]");
  if (button) openArticle(button.dataset.read);
});

document.querySelector("#gallery").addEventListener("click", (event) => {
  const articleButton = event.target.closest("[data-read]");
  if (articleButton) openArticle(articleButton.dataset.read);
});

document.querySelectorAll(".search-button").forEach((button) => {
  button.addEventListener("click", () => {
    searchDialog.showModal();
    searchInput.value = "";
    renderSearch();
    setTimeout(() => searchInput.focus(), 80);
  });
});

searchInput.addEventListener("input", () => renderSearch(searchInput.value));
searchResults.addEventListener("click", (event) => {
  const result = event.target.closest("[data-search-read]");
  if (!result) return;
  searchDialog.close();
  openArticle(result.dataset.searchRead);
});

function setCommentFormOpen(open) {
  const panel = document.querySelector("#comment-form-panel");
  const toggle = document.querySelector(".comment-compose-toggle");
  if (!panel || !toggle) return;
  panel.classList.toggle("open", open);
  toggle.classList.toggle("open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.querySelector("span:first-child").textContent = open ? "收起回复" : "发表回复";
  if (open) setTimeout(() => document.querySelector('#comment-form textarea[name="comment"]')?.focus(), 360);
}

const singlePost = document.querySelector("#single-post");
singlePost.addEventListener("click", (event) => {
  const composeToggle = event.target.closest(".comment-compose-toggle");
  if (composeToggle) {
    setCommentFormOpen(composeToggle.getAttribute("aria-expanded") !== "true");
    return;
  }
  const replyButton = event.target.closest("[data-reply-comment]");
  if (replyButton) {
    const comment = getLocalComments().find((item) => item.id === replyButton.dataset.replyComment);
    const form = document.querySelector("#comment-form");
    const context = document.querySelector("#replying-to");
    if (comment && form && context) {
      form.dataset.parentId = comment.id;
      context.hidden = false;
      context.querySelector("strong").textContent = `@${comment.name}`;
      setCommentFormOpen(true);
      document.querySelector(".comment-compose-toggle").scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }
  if (event.target.closest("[data-cancel-reply]")) {
    const form = document.querySelector("#comment-form");
    form.dataset.parentId = "";
    document.querySelector("#replying-to").hidden = true;
    return;
  }
  const articleButton = event.target.closest("[data-read]");
  if (articleButton) openArticle(articleButton.dataset.read);
  const categoryButton = event.target.closest("[data-post-category]");
  if (categoryButton) {
    activeCategory = categoryButton.dataset.postCategory;
    location.hash = "articles";
  }
});

singlePost.addEventListener("submit", async (event) => {
  const form = event.target.closest("#comment-form");
  if (!form) return;
  event.preventDefault();
  const formData = new FormData(form);
  const commentsArea = form.closest(".comments-area");
  const articleId = Number(commentsArea.dataset.commentArticle);
  const adminSubmitting = isAdmin();
  const draft = {
    parentId: form.dataset.parentId || null,
    name: adminSubmitting ? "Lorne" : String(formData.get("name") || "").trim(),
    email: adminSubmitting ? "" : String(formData.get("email") || "").trim(),
    text: String(formData.get("comment") || "").trim()
  };
  let comment;
  try {
    const payload = await blogApi.createComment(articleId, draft);
    comment = payload.comment;
    const comments = commentsByArticle.get(articleId) || [];
    comments.push(comment);
    commentsByArticle.set(articleId, comments);
    if (!adminSubmitting) {
      if (formData.get("remember")) {
        localStorage.setItem(COMMENT_PROFILE_KEY, JSON.stringify({ name: comment.name, email: comment.email }));
      } else {
        localStorage.removeItem(COMMENT_PROFILE_KEY);
      }
    }
  } catch (error) {
    showToast(error.message || "评论提交失败，请稍后重试。", 3000);
    return;
  }
  const remember = !adminSubmitting && Boolean(formData.get("remember"));
  const savedProfile = { name: comment.name, email: draft.email };
  form.reset();
  form.dataset.parentId = "";
  document.querySelector("#replying-to").hidden = true;
  if (remember) {
    form.elements.name.value = savedProfile.name;
    form.elements.email.value = savedProfile.email;
    form.elements.remember.checked = true;
  }
  renderComments(articleId);
  setCommentFormOpen(false);
  showToast("评论已发布到博客服务器。", 2400);
  setTimeout(() => document.querySelector(`#comment-${CSS.escape(comment.id)}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 380);
});

[searchDialog, loginDialog, deleteDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) dialog.close();
  });
});

document.querySelector("#admin-login-button").addEventListener("click", () => {
  document.querySelector("#login-error").textContent = "";
  loginDialog.showModal();
  setTimeout(() => document.querySelector('#login-form input[name="username"]').focus(), 80);
});

document.querySelector(".login-close").addEventListener("click", () => loginDialog.close());

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const error = document.querySelector("#login-error");
  try {
    await blogApi.login(username, password);
    adminAuthenticated = true;
    form.reset();
    error.textContent = "";
    loginDialog.close();
    await refreshArticles();
    renderAdminTools();
    renderArchive();
    renderLocalMessages();
    await applyView();
    showToast("管理员登录成功。", 2200);
  } catch (loginError) {
    error.textContent = loginError.message || "登录失败，请稍后重试。";
    form.elements.password.select();
  }
});

document.querySelector("#admin-logout-button").addEventListener("click", async () => {
  try {
    await blogApi.logout();
  } finally {
    adminAuthenticated = false;
    await refreshArticles();
    renderAdminTools();
    renderArchive();
    renderLocalMessages();
    location.hash = "home";
    await applyView();
    showToast("已退出管理员账号。", 2200);
  }
});

document.querySelector("#download-backup-button").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "正在备份…";
  try {
    const backup = await blogApi.downloadBackup();
    const date = new Date().toISOString().slice(0, 10);
    const url = URL.createObjectURL(backup);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lorne-orbit-backup-${date}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("博客备份已下载到本地。", 3200);
  } catch (error) {
    showToast(error.message || "博客备份失败，请稍后重试。", 3800);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});

document.querySelector("#legacy-migrate-button").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const state = getPostState();
  const posts = getCustomPosts().map((article) => ({
    ...article,
    hidden: Boolean(state[String(article.id)]?.hidden),
    deleted: Boolean(state[String(article.id)]?.deleted)
  })).filter((article) => !article.deleted);
  button.disabled = true;
  button.textContent = "正在迁移…";
  try {
    const result = await blogApi.migrateLegacy({ posts, images: getPostImages() });
    localStorage.setItem(LEGACY_MIGRATION_KEY, window.BLOG_CONFIG?.API_URL || "/api");
    await refreshAllArticleViews();
    renderAdminTools();
    showToast(`迁移完成：${result.imported} 篇文章，${result.uploadedImages} 张图片。`, 4200);
  } catch (error) {
    showToast(error.message || "旧数据迁移失败。", 3600);
  } finally {
    button.disabled = false;
    button.textContent = "迁移旧文章";
  }
});

document.querySelector(".editor-toolbar").addEventListener("click", (event) => {
  const button = event.target.closest("[data-markdown-before]");
  if (!button) return;
  insertAtEditorCursor(button.dataset.markdownBefore || "", button.dataset.markdownAfter || "");
});

document.querySelector("#markdown-editor").addEventListener("input", updateMarkdownPreview);
document.querySelector("#markdown-editor").addEventListener("paste", async (event) => {
  let images = clipboardImageFiles(event.clipboardData);
  const clipboardTypes = [...(event.clipboardData?.types || [])];
  const clipboardHtml = event.clipboardData?.getData("text/html") || "";
  const hasImageHint = clipboardTypes.some((type) => type.startsWith("image/") || type === "Files") || /<img\b/i.test(clipboardHtml);
  if (!images.length && !hasImageHint) return;
  event.preventDefault();
  if (!images.length) {
    try {
      images = await readClipboardImages();
    } catch {
      // Some browsers expose the image hint but deny the async Clipboard API.
    }
  }
  if (!images.length) images = await readImagesFromClipboardHtml(clipboardHtml);
  if (images.length) {
    await insertAndUploadImages(images);
  } else {
    showToast("检测到剪贴板图片，但浏览器未允许读取。请授权剪贴板权限或使用“插入图片”。", 4200);
  }
});
document.querySelector("#insert-image-button").addEventListener("click", () => document.querySelector("#editor-image-input").click());
document.querySelector("#editor-image-input").addEventListener("change", async (event) => {
  const input = event.currentTarget;
  const files = [...(input.files || [])];
  input.value = "";
  if (files.length) await insertAndUploadImages(files);
});

document.querySelector("#post-editor-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (pendingImageUploads > 0) {
    showToast("图片仍在上传，请稍候再发布。", 2600);
    return;
  }
  if (!isAdmin()) {
    loginDialog.showModal();
    return;
  }
  const form = event.currentTarget;
  const formData = new FormData(form);
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "");
  const body = String(formData.get("body") || "").trim();
  const allowedCategories = ["杂谈集", "往事如烟", "心情日记", "逆水行舟"];
  if (!title || !body || !allowedCategories.includes(category)) return;
  const plainText = plainTextFromMarkdown(body);
  const postInput = {
    category,
    title,
    lead: plainText.slice(0, 48),
    excerpt: plainText.length > 90 ? `${plainText.slice(0, 90).trimEnd()}……` : plainText,
    body
  };
  const editedPostId = editingPostId;
  let article;
  try {
    const payload = editedPostId
      ? await blogApi.updatePost(editedPostId, postInput)
      : await blogApi.createPost(postInput);
    article = payload.post;
  } catch (error) {
    showToast(error.message || (editedPostId ? "文章修改失败，请稍后重试。" : "文章发布失败，请稍后重试。"), 3200);
    return;
  }
  resetPostEditor();
  await refreshAllArticleViews();
  location.hash = `post-${article.id}`;
  showToast(editedPostId ? "文章修改已保存。" : "博客已发布到服务器。", 2600);
});

document.querySelector("#editor-cancel-button").addEventListener("click", () => {
  resetPostEditor();
  location.hash = "manage";
});

document.addEventListener("click", (event) => {
  if (event.target.closest('a[href="#write"]')) resetPostEditor();
});

document.querySelector("#manage-post-list").addEventListener("click", async (event) => {
  const openButton = event.target.closest("[data-manage-open]");
  if (openButton) {
    location.hash = `post-${openButton.dataset.manageOpen}`;
    return;
  }
  const editButton = event.target.closest("[data-edit-post]");
  if (editButton) {
    editPost(editButton.dataset.editPost);
    return;
  }
  const hiddenButton = event.target.closest("[data-toggle-hidden]");
  if (hiddenButton) {
    const id = Number(hiddenButton.dataset.toggleHidden);
    const article = getAllArticleRecords().find((item) => item.id === id);
    if (!article) return;
    try {
      await updatePostState(id, { hidden: !article.hidden });
      await refreshAllArticleViews();
      showToast(article.hidden ? "文章已恢复对访客显示。" : "文章已对访客隐藏。", 2200);
    } catch (error) {
      showToast(error.message || "文章状态更新失败。", 2800);
    }
    return;
  }
  const deleteButton = event.target.closest("[data-delete-post]");
  if (!deleteButton) return;
  const id = Number(deleteButton.dataset.deletePost);
  const article = getAllArticleRecords().find((item) => item.id === id);
  if (!article) return;
  deleteDialog.dataset.articleId = String(id);
  document.querySelector("#delete-dialog-message").textContent = `《${article.title}》`;
  toast.classList.remove("show");
  deleteDialog.showModal();
  setTimeout(() => document.querySelector("#delete-cancel-button").focus(), 80);
});

document.querySelector("#delete-cancel-button").addEventListener("click", () => deleteDialog.close());

document.querySelector("#delete-confirm-button").addEventListener("click", async () => {
  const id = Number(deleteDialog.dataset.articleId);
  const article = getAllArticleRecords().find((item) => item.id === id);
  if (!article) {
    deleteDialog.close();
    return;
  }
  try {
    await blogApi.deletePost(id);
  } catch (error) {
    showToast(error.message || "文章删除失败。", 2800);
    return;
  }
  commentsByArticle.delete(id);
  deleteDialog.close();
  deleteDialog.dataset.articleId = "";
  await refreshAllArticleViews();
  showToast("文章及其评论已从服务器删除。", 2200);
});

const menuButton = document.querySelector(".mobile-menu");
const topNav = document.querySelector(".top-nav");
menuButton.addEventListener("click", () => {
  const open = topNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});
topNav.addEventListener("click", () => {
  topNav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
});

document.querySelector("#message-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (messageSubmitInFlight) return;
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const originalButtonContent = button.innerHTML;
  const formData = new FormData(form);
  const message = {
    name: String(formData.get("name") || "").trim() || "一位路过的朋友",
    text: String(formData.get("message") || "").trim()
  };
  const fingerprint = `${message.name}\n${message.text}`;
  if (!messageDraftRequest || messageDraftRequest.fingerprint !== fingerprint) {
    messageDraftRequest = { fingerprint, id: createClientRequestId() };
  }
  messageSubmitInFlight = true;
  button.disabled = true;
  button.textContent = "正在发布……";
  try {
    const payload = await blogApi.createMessage(message, messageDraftRequest.id);
    serverMessages = [payload.message, ...serverMessages.filter((item) => String(item.id) !== String(payload.message.id))];
    messageDraftRequest = null;
    form.reset();
    renderLocalMessages();
    showToast("留言已发布到博客服务器。", 2800);
  } catch (error) {
    showToast(error.message || "发布暂未成功，再次点击会安全重试，不会重复留言。", 3600);
  } finally {
    messageSubmitInFlight = false;
    button.disabled = false;
    button.innerHTML = originalButtonContent;
  }
});

localMessageList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete-message]");
  if (!button) return;
  const messageId = button.dataset.deleteMessage;
  button.disabled = true;
  button.textContent = "…";
  try {
    const result = await blogApi.deleteMessage(messageId);
    serverMessages = serverMessages.filter((message) => String(message.id) !== String(result.id));
  } catch (error) {
    button.disabled = false;
    button.textContent = "×";
    showToast(error.message || "留言删除失败。", 2800);
    return;
  }
  renderLocalMessages();
  showToast("这条留言已从服务器删除。", 2200);
});

window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  document.querySelector(".reading-progress").style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  const originalNav = document.querySelector(".journal-nav-wrap");
  const floatingNav = document.querySelector("#floating-nav");
  const showFloatingNav = originalNav.getBoundingClientRect().bottom <= 0;
  floatingNav.classList.toggle("show", showFloatingNav);
  floatingNav.setAttribute("aria-hidden", String(!showFloatingNav));
  document.querySelector("#back-to-top").classList.toggle("show", window.scrollY > 200);
}, { passive: true });

document.querySelector("#back-to-top").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function loadPostsWithRetry(includeHidden, attempts = 3) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await blogApi.getPosts(includeHidden, { timeout: 12000 });
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await wait(Math.min(1200 * (2 ** attempt), 3000));
    }
  }
  throw lastError;
}

function scheduleArticleReload() {
  clearTimeout(articleReloadTimer);
  articleReloadTimer = setTimeout(async () => {
    try {
      await refreshArticles();
      articleLoadError = null;
      await refreshAllArticleViews();
      showToast("文章服务器已连接，内容已自动更新。", 2600);
    } catch (error) {
      articleLoadError = error;
      scheduleArticleReload();
    }
  }, 8000);
}

async function initializeApp() {
  const cachedPosts = readArticleCache();
  if (cachedPosts.length) {
    allArticles = cachedPosts;
    articles = cachedPosts.filter((article) => !article.hidden);
  }
  renderAdminTools();
  renderLocalMessages();
  renderArchive();
  const requestedPostWithoutCache = location.hash.startsWith("#post-") && !cachedPosts.length;
  if (!requestedPostWithoutCache) await applyView();

  const sessionPromise = blogApi.getSession({ timeout: 4500 }).catch(() => ({ authenticated: false }));
  const postsPromise = loadPostsWithRetry(false);
  const messagesPromise = blogApi.getMessages({ timeout: 6000 }).catch(() => ({ messages: [] }));
  try {
    const postsPayload = await postsPromise;
    allArticles = postsPayload.posts;
    articles = allArticles.filter((article) => !article.hidden);
    writeArticleCache(articles);
    articleLoadError = null;
  } catch (error) {
    if (!cachedPosts.length) {
      allArticles = [];
      articles = [];
    }
    articleLoadError = error;
    showToast("文章服务器正在启动，连接成功后会自动显示你的文章。", 5200);
    scheduleArticleReload();
  }
  renderArchive();
  await applyView();

  void messagesPromise.then((payload) => {
    serverMessages = payload.messages;
    renderLocalMessages();
  });

  const session = await sessionPromise;
  adminAuthenticated = Boolean(session?.authenticated);
  if (adminAuthenticated) {
    const adminPayload = await blogApi.getPosts(true, { timeout: 8000 }).catch(() => null);
    if (adminPayload) {
      allArticles = adminPayload.posts;
      articles = allArticles;
      renderArchive();
      await applyView();
    }
  }
  renderAdminTools();
}

window.addEventListener("hashchange", () => void applyView());
void initializeApp();
