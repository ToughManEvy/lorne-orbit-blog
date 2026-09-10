import { strToU8, zipSync } from "fflate";

const ALLOWED_CATEGORIES = new Set(["杂谈集", "往事如烟", "心情日记", "逆水行舟"]);
const CSRF_HEADER_VALUE = "lorne-orbit-web";
const COOKIE_NAME = "lorne_orbit_admin";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(data, status = 200, headers = {}) {
  return new Response(data === null ? null : JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}

function asText(value, max, fallback = "") {
  return String(value ?? fallback).trim().slice(0, max);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function articleId(value) {
  if (!/^\d{1,16}$/.test(String(value || ""))) throw new HttpError(400, "文章 ID 不正确");
  return Number(value);
}

function uuid(value) {
  if (!isUuid(value)) throw new HttpError(400, "资源 ID 不正确");
  return value;
}

function bool(value) {
  return Boolean(Number(value));
}

const chineseDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

function formatChineseDate(value = new Date()) {
  const parts = Object.fromEntries(chineseDateFormatter.formatToParts(new Date(value)).map(({ type, value: part }) => [type, part]));
  return `${parts.year}年${parts.month}月${parts.day}日 ${parts.hour}:${parts.minute}`;
}

function postFromRow(row) {
  return {
    id: Number(row.id),
    category: row.category,
    date: row.published_label,
    createdAt: row.created_at,
    title: row.title,
    lead: row.lead,
    excerpt: row.excerpt,
    body: row.body,
    featured: bool(row.featured),
    hidden: bool(row.hidden),
    isCustom: true,
    isMarkdown: bool(row.is_markdown)
  };
}

function commentFromRow(row) {
  return {
    id: row.id,
    articleId: Number(row.article_id),
    parentId: row.parent_id,
    name: row.name,
    text: row.body,
    date: formatChineseDate(row.created_at),
    createdAt: row.created_at,
    isAdmin: bool(row.is_admin)
  };
}

function adminCommentFromRow(row) {
  return {
    ...commentFromRow(row),
    email: row.email,
    articleTitle: row.article_title
  };
}

function messageFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    text: row.body,
    date: new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(new Date(row.created_at)),
    createdAt: row.created_at
  };
}

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeBase64Url(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")), (char) => char.charCodeAt(0));
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

async function issueToken(env) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = base64Url(encoder.encode(JSON.stringify({
    sub: env.ADMIN_USERNAME,
    role: "admin",
    iss: "lorne-orbit-api",
    aud: "lorne-orbit-admin",
    iat: now,
    exp: now + 8 * 60 * 60
  })));
  const input = `${header}.${payload}`;
  return `${input}.${base64Url(await hmac(env.JWT_SECRET, input))}`;
}

async function verifyToken(env, token) {
  try {
    const [header, payload, signature] = String(token || "").split(".");
    if (!header || !payload || !signature) return null;
    const expected = await hmac(env.JWT_SECRET, `${header}.${payload}`);
    const received = decodeBase64Url(signature);
    if (received.length !== expected.length) return null;
    let difference = 0;
    for (let index = 0; index < expected.length; index += 1) difference |= expected[index] ^ received[index];
    if (difference) return null;
    const claims = JSON.parse(decoder.decode(decodeBase64Url(payload)));
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp <= now || claims.iss !== "lorne-orbit-api" || claims.aud !== "lorne-orbit-admin" || claims.role !== "admin") return null;
    return claims;
  } catch {
    return null;
  }
}

function cookieValue(request, name) {
  const cookies = String(request.headers.get("Cookie") || "").split(";");
  for (const cookie of cookies) {
    const [key, ...parts] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(parts.join("="));
  }
  return "";
}

async function readAdmin(request, env) {
  const bearer = String(request.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  return verifyToken(env, bearer || cookieValue(request, COOKIE_NAME));
}

async function requireAdmin(request, env) {
  const admin = await readAdmin(request, env);
  if (!admin) throw new HttpError(401, "需要管理员登录");
  return admin;
}

function requireWebClient(request) {
  if (request.headers.get("X-Requested-With") !== CSRF_HEADER_VALUE) throw new HttpError(403, "请求来源验证失败");
}

async function parseJson(request, maxBytes = 15 * 1024 * 1024) {
  const size = Number(request.headers.get("Content-Length") || 0);
  if (size > maxBytes) throw new HttpError(413, "请求内容过大");
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "请求内容不是有效的 JSON");
  }
}

function clientKey(request) {
  return request.headers.get("CF-Connecting-IP") || "local";
}

async function enforceRateLimit(env, request, scope, windowSeconds, limit) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  const key = clientKey(request);
  await env.DB.prepare(`
    INSERT INTO rate_limits (scope, client_key, window_start, request_count)
    VALUES (?1, ?2, ?3, 1)
    ON CONFLICT (scope, client_key, window_start)
    DO UPDATE SET request_count = request_count + 1
  `).bind(scope, key, windowStart).run();
  const row = await env.DB.prepare("SELECT request_count FROM rate_limits WHERE scope = ?1 AND client_key = ?2 AND window_start = ?3")
    .bind(scope, key, windowStart).first();
  if (Number(row?.request_count || 0) > limit) throw new HttpError(429, "请求过于频繁，请稍后重试");
}

async function sha256Hex(value) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantStringEqual(left, right) {
  const a = String(left);
  const b = String(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  return difference === 0;
}

function cloudinaryPublicIds(markdown, env) {
  const cloudName = String(env.CLOUDINARY_CLOUD_NAME || "").replace(/[^a-zA-Z0-9_-]/g, "");
  if (!cloudName) return [];
  const pattern = new RegExp(`https://res\\.cloudinary\\.com/${cloudName}/image/upload/[^)\\s]+`, "g");
  const ids = [];
  for (const url of String(markdown || "").match(pattern) || []) {
    const pathAfterUpload = url.split("/image/upload/")[1] || "";
    const versionIndex = pathAfterUpload.search(/(?:^|\/)v\d+\//);
    if (versionIndex < 0) continue;
    const publicId = decodeURIComponent(pathAfterUpload.slice(versionIndex).replace(/^\/?v\d+\//, "")).replace(/\.[a-zA-Z0-9]+$/, "");
    if (publicId) ids.push(publicId);
  }
  return [...new Set(ids)];
}

function cloudinaryImageUrls(markdown, env) {
  const cloudName = String(env.CLOUDINARY_CLOUD_NAME || "").replace(/[^a-zA-Z0-9_-]/g, "");
  if (!cloudName) return [];
  const pattern = new RegExp(`https://res\\.cloudinary\\.com/${cloudName}/image/upload/[^)\\s"']+`, "g");
  return [...new Set(String(markdown || "").match(pattern) || [])];
}

function siteImageUrls(markdown) {
  const matches = String(markdown || "").match(/\/(?:images|uploads)\/[^)\s"']+/g) || [];
  return [...new Set(matches.filter((value) => !value.includes("..")))];
}

function r2KeyFromPath(pathname) {
  if (!pathname.startsWith("/uploads/")) return "";
  let key;
  try {
    key = decodeURIComponent(pathname.slice("/uploads/".length));
  } catch {
    return "";
  }
  if (!key || key.length > 1024 || key.startsWith("/") || key.split("/").includes("..")) return "";
  return key;
}

function r2ImageKeys(markdown) {
  return siteImageUrls(markdown).map((value) => r2KeyFromPath(new URL(value, "https://blog.invalid").pathname)).filter(Boolean);
}

const r2ImageExtensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

async function uploadToR2(env, blob, filename = "image") {
  if (!env.IMAGES) throw new HttpError(503, "服务器尚未配置图片存储");
  const extension = r2ImageExtensions[blob.type];
  if (!extension) throw new HttpError(400, "图片格式不正确");
  const date = new Date().toISOString().slice(0, 7);
  const key = `articles/${date}/${crypto.randomUUID()}.${extension}`;
  await env.IMAGES.put(key, blob.stream(), {
    httpMetadata: { contentType: blob.type, cacheControl: "public, max-age=31536000, immutable" },
    customMetadata: { originalName: asText(filename, 180, "image") }
  });
  return { url: `/uploads/${key}`, publicId: key };
}

async function sha1Hex(value) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-1", encoder.encode(value)));
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function cloudinarySignature(params, secret) {
  const input = Object.entries(params).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}=${value}`).join("&");
  return sha1Hex(`${input}${secret}`);
}

function requireCloudinary(env) {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new HttpError(503, "服务器尚未配置图片存储");
  }
}

async function uploadToCloudinary(env, blob, filename = "image") {
  requireCloudinary(env);
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = env.CLOUDINARY_FOLDER || "lorne-orbit";
  const signature = await cloudinarySignature({ folder, timestamp }, env.CLOUDINARY_API_SECRET);
  const form = new FormData();
  form.append("file", blob, filename);
  form.append("api_key", env.CLOUDINARY_API_KEY);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/image/upload`, { method: "POST", body: form });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || `Cloudinary 上传失败（${response.status}）`);
  return payload;
}

async function destroyCloudinaryImage(env, publicId) {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) return;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await cloudinarySignature({ public_id: publicId, timestamp }, env.CLOUDINARY_API_SECRET);
  const form = new FormData();
  form.append("public_id", publicId);
  form.append("timestamp", String(timestamp));
  form.append("api_key", env.CLOUDINARY_API_KEY);
  form.append("signature", signature);
  await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/image/destroy`, { method: "POST", body: form });
}

function dataUrlBlob(data) {
  const match = String(data).match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([a-zA-Z0-9+/=]+)$/);
  if (!match || data.length > 5_500_000) return null;
  const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: match[1] });
}

function safeBackupName(value, fallback) {
  const safe = String(value || "").normalize("NFKC").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ").replace(/[. ]+$/g, "").trim().slice(0, 80);
  return safe || fallback;
}

function backupImageExtension(url, contentType) {
  const types = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };
  if (types[contentType]) return types[contentType];
  const match = new URL(url, "https://blog.invalid").pathname.match(/\.(jpe?g|png|webp|gif)$/i);
  return match ? `.${match[1].toLowerCase().replace("jpeg", "jpg")}` : ".img";
}

function markdownBackup(post, imageFiles) {
  let body = String(post.body || "");
  for (const [url, filename] of imageFiles) body = body.split(url).join(`../images/${filename}`);
  return ["---", `id: ${post.id}`, `title: ${JSON.stringify(post.title)}`, `category: ${JSON.stringify(post.category)}`,
    `published: ${JSON.stringify(post.published_label)}`, `createdAt: ${JSON.stringify(post.created_at)}`,
    `hidden: ${bool(post.hidden)}`, "---", "", body, ""].join("\n");
}

async function createBackup(env, request) {
  const [postsResult, commentsResult, messagesResult] = await Promise.all([
    env.DB.prepare("SELECT * FROM posts ORDER BY sort_order DESC, id DESC").all(),
    env.DB.prepare("SELECT * FROM comments ORDER BY created_at ASC").all(),
    env.DB.prepare("SELECT * FROM messages ORDER BY created_at ASC").all()
  ]);
  const posts = postsResult.results || [];
  const comments = commentsResult.results || [];
  const messages = messagesResult.results || [];
  const imageUrls = [...new Set(posts.flatMap((post) => [...cloudinaryImageUrls(post.body, env), ...siteImageUrls(post.body)]))];
  const imageFiles = new Map();
  const failedImages = [];
  const downloadedImages = [];
  const files = {};

  for (const [index, url] of imageUrls.entries()) {
    try {
      let contentType;
      let bytes;
      const pathname = new URL(url, request.url).pathname;
      const r2Key = r2KeyFromPath(pathname);
      if (r2Key) {
        const object = await env.IMAGES.get(r2Key);
        if (!object) throw new Error("R2 图片不存在");
        contentType = String(object.httpMetadata?.contentType || "").toLowerCase();
        bytes = new Uint8Array(await object.arrayBuffer());
      } else {
        const response = url.startsWith("/")
          ? await env.ASSETS.fetch(new Request(new URL(url, request.url)))
          : await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        contentType = String(response.headers.get("content-type") || "").split(";")[0].toLowerCase();
        bytes = new Uint8Array(await response.arrayBuffer());
      }
      if (!contentType.startsWith("image/")) throw new Error("响应不是图片");
      if (bytes.length > 20 * 1024 * 1024) throw new Error("图片超过 20MB");
      const publicPart = decodeURIComponent(pathname.split("/").pop() || `image-${index + 1}`).replace(/\.[a-zA-Z0-9]+$/, "");
      const filename = `${String(index + 1).padStart(3, "0")}-${safeBackupName(publicPart, "image")}${backupImageExtension(url, contentType)}`;
      imageFiles.set(url, filename);
      files[`images/${filename}`] = bytes;
      downloadedImages.push({ sourceUrl: url, file: `images/${filename}`, bytes: bytes.length });
    } catch (error) {
      failedImages.push({ sourceUrl: url, error: error.message });
    }
  }

  const generatedAt = new Date();
  const backupData = {
    format: "lorne-orbit-backup",
    version: 1,
    generatedAt: generatedAt.toISOString(),
    counts: { posts: posts.length, comments: comments.length, messages: messages.length, images: downloadedImages.length },
    posts, comments, messages, images: downloadedImages, failedImages
  };
  files["data/backup.json"] = strToU8(JSON.stringify(backupData, null, 2));
  files["README.txt"] = strToU8([
    "Lorne's orbit 博客备份",
    `生成时间：${generatedAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
    `文章：${posts.length} 篇；评论：${comments.length} 条；留言：${messages.length} 条；图片：${downloadedImages.length} 张。`,
    "", "data/backup.json 包含可用于恢复的完整结构化数据。",
    "articles/ 包含 Markdown 文章，images/ 包含文章引用的站内、R2 或 Cloudinary 图片。",
    failedImages.length ? `有 ${failedImages.length} 张图片下载失败，详情见 backup.json。` : "全部引用图片均已保存。",
    "备份可能包含评论者邮箱，请妥善保管。", ""
  ].join("\n"));
  posts.forEach((post, index) => {
    files[`articles/${String(index + 1).padStart(3, "0")}-${safeBackupName(post.title, `post-${post.id}`)}.md`] = strToU8(markdownBackup(post, imageFiles));
  });
  return { date: generatedAt.toISOString().slice(0, 10), bytes: zipSync(files, { level: 0 }) };
}

async function handleApi(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === "GET" && path === "/api/health") {
    await env.DB.prepare("SELECT 1").first();
    return json({ ok: true });
  }

  if (method === "GET" && path === "/api/auth/me") {
    const admin = await readAdmin(request, env);
    return json({ authenticated: Boolean(admin), username: admin?.sub || null });
  }

  if (method === "POST" && path === "/api/auth/login") {
    requireWebClient(request);
    await enforceRateLimit(env, request, "login", 15 * 60, 10);
    const body = await parseJson(request, 4096);
    const username = asText(body?.username, 80);
    const passwordHash = await sha256Hex(String(body?.password || ""));
    const valid = constantStringEqual(username, env.ADMIN_USERNAME) && constantStringEqual(passwordHash, env.ADMIN_PASSWORD_HASH);
    if (!valid) throw new HttpError(401, "用户名或密码不正确");
    const token = await issueToken(env);
    return json({ authenticated: true, username: env.ADMIN_USERNAME, token }, 200, {
      "Set-Cookie": `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Max-Age=${8 * 60 * 60}; Path=/`
    });
  }

  if (method === "POST" && path === "/api/auth/logout") {
    requireWebClient(request);
    return new Response(null, { status: 204, headers: { "Set-Cookie": `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/` } });
  }

  if (method === "GET" && path === "/api/admin/comments") {
    await requireAdmin(request, env);
    const result = await env.DB.prepare(`
      SELECT comments.*, posts.title AS article_title
      FROM comments
      INNER JOIN posts ON posts.id = comments.article_id
      WHERE comments.is_admin = 0
      ORDER BY comments.created_at DESC
      LIMIT 200
    `).all();
    return json({ comments: (result.results || []).map(adminCommentFromRow) });
  }

  if (method === "GET" && path === "/api/posts") {
    const includeHidden = url.searchParams.get("includeHidden") === "true" && Boolean(await readAdmin(request, env));
    const result = await env.DB.prepare(`SELECT * FROM posts ${includeHidden ? "" : "WHERE hidden = 0"} ORDER BY sort_order DESC, id DESC`).all();
    return json({ posts: (result.results || []).map(postFromRow) });
  }

  if (method === "POST" && path === "/api/posts") {
    requireWebClient(request);
    await requireAdmin(request, env);
    await enforceRateLimit(env, request, "write", 15 * 60, 60);
    const body = await parseJson(request);
    const title = asText(body?.title, 120);
    const category = asText(body?.category, 50);
    const content = asText(body?.body, 200000);
    if (!title || !content || !ALLOWED_CATEGORIES.has(category)) throw new HttpError(400, "文章内容不完整");
    const id = Date.now();
    const createdAt = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO posts
      (id, category, published_label, created_at, sort_order, title, lead, excerpt, body, is_markdown)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 1)`)
      .bind(id, category, formatChineseDate(createdAt), createdAt, id, title, asText(body?.lead, 300), asText(body?.excerpt, 600), content).run();
    const row = await env.DB.prepare("SELECT * FROM posts WHERE id = ?1").bind(id).first();
    return json({ post: postFromRow(row) }, 201);
  }

  const postMatch = path.match(/^\/api\/posts\/(\d{1,16})$/);
  if (postMatch && method === "PATCH") {
    requireWebClient(request);
    await requireAdmin(request, env);
    await enforceRateLimit(env, request, "write", 15 * 60, 60);
    const id = articleId(postMatch[1]);
    const body = await parseJson(request, 256 * 1024);
    const current = await env.DB.prepare("SELECT * FROM posts WHERE id = ?1").bind(id).first();
    if (!current) throw new HttpError(404, "文章不存在");
    const has = (key) => Object.prototype.hasOwnProperty.call(body || {}, key);
    const editsContent = ["title", "category", "body", "lead", "excerpt"].some(has);
    if (!editsContent && !has("hidden")) throw new HttpError(400, "没有需要更新的文章内容");
    if (has("hidden") && typeof body.hidden !== "boolean") throw new HttpError(400, "文章状态不正确");
    const title = has("title") ? asText(body.title, 120) : current.title;
    const category = has("category") ? asText(body.category, 50) : current.category;
    const content = has("body") ? asText(body.body, 200000) : current.body;
    const lead = has("lead") ? asText(body.lead, 300) : current.lead;
    const excerpt = has("excerpt") ? asText(body.excerpt, 600) : current.excerpt;
    if (!title || !content || !ALLOWED_CATEGORIES.has(category)) throw new HttpError(400, "文章内容不完整");
    const hidden = has("hidden") ? (body.hidden ? 1 : 0) : Number(current.hidden);
    const isMarkdown = has("body") ? 1 : Number(current.is_markdown);
    const result = await env.DB.prepare(`UPDATE posts
      SET title = ?1, category = ?2, body = ?3, lead = ?4, excerpt = ?5, hidden = ?6, is_markdown = ?7
      WHERE id = ?8`)
      .bind(title, category, content, lead, excerpt, hidden, isMarkdown, id).run();
    if (!result.meta.changes) throw new HttpError(404, "文章不存在");
    const row = await env.DB.prepare("SELECT * FROM posts WHERE id = ?1").bind(id).first();
    return json({ post: postFromRow(row) });
  }

  if (postMatch && method === "DELETE") {
    requireWebClient(request);
    await requireAdmin(request, env);
    await enforceRateLimit(env, request, "write", 15 * 60, 60);
    const id = articleId(postMatch[1]);
    const row = await env.DB.prepare("SELECT body FROM posts WHERE id = ?1").bind(id).first();
    if (!row) throw new HttpError(404, "文章不存在");
    await env.DB.prepare("DELETE FROM posts WHERE id = ?1").bind(id).run();
    const cloudinaryDeletes = cloudinaryPublicIds(row.body, env).map((publicId) => destroyCloudinaryImage(env, publicId));
    const r2Keys = r2ImageKeys(row.body);
    const r2Deletes = r2Keys.length && env.IMAGES ? [env.IMAGES.delete(r2Keys)] : [];
    ctx.waitUntil(Promise.allSettled([...cloudinaryDeletes, ...r2Deletes]));
    return new Response(null, { status: 204 });
  }

  const commentsMatch = path.match(/^\/api\/posts\/(\d{1,16})\/comments$/);
  if (commentsMatch && method === "GET") {
    const id = articleId(commentsMatch[1]);
    const admin = await readAdmin(request, env);
    const post = await env.DB.prepare("SELECT hidden FROM posts WHERE id = ?1").bind(id).first();
    if (!post || (bool(post.hidden) && !admin)) throw new HttpError(404, "文章不存在");
    const result = await env.DB.prepare("SELECT * FROM comments WHERE article_id = ?1 ORDER BY created_at ASC").bind(id).all();
    return json({ comments: (result.results || []).map(commentFromRow) });
  }

  if (commentsMatch && method === "POST") {
    requireWebClient(request);
    await enforceRateLimit(env, request, "write", 15 * 60, 60);
    const id = articleId(commentsMatch[1]);
    const admin = await readAdmin(request, env);
    const post = await env.DB.prepare("SELECT hidden FROM posts WHERE id = ?1").bind(id).first();
    if (!post || (bool(post.hidden) && !admin)) throw new HttpError(404, "文章不存在");
    const input = await parseJson(request, 8192);
    const commentId = crypto.randomUUID();
    const parentId = input?.parentId || null;
    const name = admin ? env.ADMIN_USERNAME : asText(input?.name, 40);
    const email = admin ? "" : asText(input?.email, 254).toLowerCase();
    const content = asText(input?.text, 1200);
    if (!name || !content || (!admin && !/^\S+@\S+\.\S+$/.test(email))) throw new HttpError(400, "评论内容或邮箱格式不正确");
    if (parentId && !isUuid(parentId)) throw new HttpError(400, "回复的评论 ID 不正确");
    if (parentId) {
      const parent = await env.DB.prepare("SELECT 1 FROM comments WHERE id = ?1 AND article_id = ?2").bind(parentId, id).first();
      if (!parent) throw new HttpError(400, "回复的评论不存在");
    }
    const createdAt = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO comments (id, article_id, parent_id, name, email, body, is_admin, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`)
      .bind(commentId, id, parentId, name, email, content, admin ? 1 : 0, createdAt).run();
    const row = await env.DB.prepare("SELECT * FROM comments WHERE id = ?1").bind(commentId).first();
    return json({ comment: commentFromRow(row) }, 201);
  }

  if (method === "GET" && path === "/api/messages") {
    const result = await env.DB.prepare("SELECT * FROM messages ORDER BY created_at DESC LIMIT 100").all();
    return json({ messages: (result.results || []).map(messageFromRow) });
  }

  if (method === "POST" && path === "/api/messages") {
    requireWebClient(request);
    await enforceRateLimit(env, request, "write", 15 * 60, 60);
    const input = await parseJson(request, 8192);
    const name = asText(input?.name, 40, "一位路过的朋友") || "一位路过的朋友";
    const content = asText(input?.text, 300);
    const requestId = asText(request.headers.get("Idempotency-Key"), 36) || null;
    if (!content) throw new HttpError(400, "留言不能为空");
    if (requestId && !isUuid(requestId)) throw new HttpError(400, "留言请求标识不正确");
    if (requestId) {
      const existing = await env.DB.prepare("SELECT * FROM messages WHERE request_id = ?1").bind(requestId).first();
      if (existing) return json({ message: messageFromRow(existing) }, 201);
    }
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO messages (id, name, body, request_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5)")
      .bind(id, name, content, requestId, new Date().toISOString()).run();
    const row = await env.DB.prepare("SELECT * FROM messages WHERE id = ?1").bind(id).first();
    return json({ message: messageFromRow(row) }, 201);
  }

  const deleteMessageMatch = path.match(/^\/api\/messages\/([^/]+)(?:\/delete)?$/);
  if (deleteMessageMatch && (method === "DELETE" || method === "POST")) {
    requireWebClient(request);
    await requireAdmin(request, env);
    await enforceRateLimit(env, request, "write", 15 * 60, 60);
    const id = uuid(deleteMessageMatch[1]);
    const result = await env.DB.prepare("DELETE FROM messages WHERE id = ?1").bind(id).run();
    return json({ id, deleted: Boolean(result.meta.changes) });
  }

  if (method === "POST" && path === "/api/uploads") {
    requireWebClient(request);
    await requireAdmin(request, env);
    await enforceRateLimit(env, request, "write", 15 * 60, 60);
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File) || !/^image\/(?:jpeg|png|webp|gif)$/.test(file.type) || file.size > 4 * 1024 * 1024) {
      throw new HttpError(400, "图片过大或上传格式不正确");
    }
    const result = await uploadToR2(env, file, file.name || "image");
    return json(result, 201);
  }

  if (method === "GET" && path === "/api/backups/download") {
    requireWebClient(request);
    await requireAdmin(request, env);
    await enforceRateLimit(env, request, "backup", 60 * 60, 10);
    const backup = await createBackup(env, request);
    return new Response(backup.bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="lorne-orbit-backup-${backup.date}.zip"`,
        "Cache-Control": "private, no-store"
      }
    });
  }

  if (method === "POST" && path === "/api/migrations/legacy") {
    requireWebClient(request);
    await requireAdmin(request, env);
    await enforceRateLimit(env, request, "write", 15 * 60, 60);
    const input = await parseJson(request);
    const incomingPosts = Array.isArray(input?.posts) ? input.posts.slice(0, 1000) : [];
    const images = input?.images && typeof input.images === "object" ? input.images : {};
    if (!incomingPosts.length) throw new HttpError(400, "没有可迁移的文章");
    const imageUrls = {};
    for (const [imageId, image] of Object.entries(images).slice(0, 30)) {
      const blob = dataUrlBlob(image?.data);
      if (!blob) continue;
      const uploaded = await uploadToR2(env, blob, `legacy-${imageId}`);
      imageUrls[imageId] = uploaded.url;
    }
    const baseOrder = Date.now();
    const statements = [];
    let imported = 0;
    for (const [index, post] of incomingPosts.entries()) {
      const id = Number(post.id);
      const title = asText(post.title, 120);
      const category = asText(post.category, 50);
      let content = asText(post.body, 200000);
      if (!Number.isSafeInteger(id) || !title || !content || !ALLOWED_CATEGORIES.has(category)) continue;
      content = content.replace(/local-image:\/\/([^)\s]+)/g, (match, imageId) => imageUrls[imageId] || match);
      const createdAt = new Date(post.createdAt || Date.now()).toISOString();
      statements.push(env.DB.prepare(`INSERT INTO posts
        (id, category, published_label, created_at, sort_order, title, lead, excerpt, body, featured, hidden, is_markdown)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
        ON CONFLICT(id) DO UPDATE SET category=excluded.category, published_label=excluded.published_label,
        created_at=excluded.created_at, sort_order=excluded.sort_order, title=excluded.title, lead=excluded.lead,
        excerpt=excluded.excerpt, body=excluded.body, featured=excluded.featured, hidden=excluded.hidden,
        is_markdown=excluded.is_markdown`)
        .bind(id, category, asText(post.date, 80, formatChineseDate()), createdAt, baseOrder - index, title,
          asText(post.lead, 300), asText(post.excerpt, 600), content, post.featured ? 1 : 0, post.hidden ? 1 : 0, post.isMarkdown ? 1 : 0));
      imported += 1;
    }
    for (let index = 0; index < statements.length; index += 100) await env.DB.batch(statements.slice(index, index + 100));
    return json({ imported, uploadedImages: Object.keys(imageUrls).length });
  }

  throw new HttpError(404, "接口不存在");
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return {};
  const requestOrigin = new URL(request.url).origin;
  const configured = String(env.FRONTEND_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean);
  if (origin !== requestOrigin && !configured.includes(origin)) throw new HttpError(403, "不允许的请求来源");
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Idempotency-Key, X-Requested-With",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Vary": "Origin"
  };
}

function withSecurityHeaders(response, cors = {}) {
  const result = new Response(response.body, response);
  Object.entries(cors).forEach(([key, value]) => result.headers.set(key, value));
  result.headers.set("X-Content-Type-Options", "nosniff");
  result.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  result.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  result.headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  return result;
}

async function handleR2Image(request, env) {
  if (request.method !== "GET" && request.method !== "HEAD") throw new HttpError(405, "请求方法不支持");
  if (!env.IMAGES) throw new HttpError(503, "服务器尚未配置图片存储");
  const key = r2KeyFromPath(new URL(request.url).pathname);
  if (!key) throw new HttpError(400, "图片路径不正确");
  const object = await env.IMAGES.get(key);
  if (!object) throw new HttpError(404, "图片不存在");
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(request.method === "HEAD" ? null : object.body, { status: 200, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/uploads/")) return withSecurityHeaders(await handleR2Image(request, env));
      if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
      const cors = corsHeaders(request, env);
      if (request.method === "OPTIONS") return withSecurityHeaders(new Response(null, { status: 204 }), cors);
      const response = await handleApi(request, env, ctx);
      return withSecurityHeaders(response, cors);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      if (!(error instanceof HttpError)) console.error(error);
      let cors = {};
      try { cors = corsHeaders(request, env); } catch {}
      return withSecurityHeaders(json({ error: status === 500 ? "服务器暂时无法处理请求" : error.message }, status), cors);
    }
  }
};
