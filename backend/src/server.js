require("dotenv").config();

const crypto = require("node:crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const archiver = require("archiver");
const { v2: cloudinary } = require("cloudinary");
const { rateLimit } = require("express-rate-limit");
const { pool, migrate } = require("./db");
const { readAdmin, requireAdmin, issueAdminCookie, clearAdminCookie } = require("./auth");

const requiredEnv = ["DATABASE_URL", "FRONTEND_ORIGINS", "ADMIN_USERNAME", "ADMIN_PASSWORD_HASH", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must contain at least 32 characters.");
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT || 3000);
const allowedOrigins = process.env.FRONTEND_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);
const allowedCategories = new Set(["杂谈集", "往事如烟", "心情日记", "逆水行舟"]);
const csrfHeaderValue = "lorne-orbit-web";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Origin is not allowed by CORS"));
  }
}));
app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());

const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });
const backupLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });

function requireWebClient(req, res, next) {
  if (req.get("X-Requested-With") !== csrfHeaderValue) {
    return res.status(403).json({ error: "请求来源验证失败" });
  }
  next();
}

function requireArticleId(req, res, next) {
  if (!/^\d{1,16}$/.test(String(req.params.id || ""))) return res.status(400).json({ error: "文章 ID 不正确" });
  next();
}

function requireUuid(req, res, next) {
  if (!isUuid(req.params.id)) {
    return res.status(400).json({ error: "资源 ID 不正确" });
  }
  next();
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function asText(value, max, fallback = "") {
  const text = String(value ?? fallback).trim();
  return text.slice(0, max);
}

function formatChineseDate(value = new Date()) {
  const date = new Date(value);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
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
    featured: row.featured,
    hidden: row.hidden,
    isCustom: true,
    isMarkdown: row.is_markdown
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
    isAdmin: row.is_admin
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

function cloudinaryPublicIds(markdown) {
  const ids = [];
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return ids;
  const safeCloudName = cloudName.replace(/[^a-zA-Z0-9_-]/g, "");
  const pattern = new RegExp(`https://res\\.cloudinary\\.com/${safeCloudName}/image/upload/[^)\\s]+`, "g");
  for (const url of String(markdown || "").match(pattern) || []) {
    const pathAfterUpload = url.split("/image/upload/")[1] || "";
    const versionIndex = pathAfterUpload.search(/(?:^|\/)v\d+\//);
    if (versionIndex < 0) continue;
    const versionedPath = pathAfterUpload.slice(versionIndex).replace(/^\/?v\d+\//, "");
    const publicId = decodeURIComponent(versionedPath).replace(/\.[a-zA-Z0-9]+$/, "");
    if (publicId) ids.push(publicId);
  }
  return [...new Set(ids)];
}

function cloudinaryImageUrls(markdown) {
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").replace(/[^a-zA-Z0-9_-]/g, "");
  if (!cloudName) return [];
  const pattern = new RegExp(`https://res\\.cloudinary\\.com/${cloudName}/image/upload/[^)\\s"']+`, "g");
  return [...new Set(String(markdown || "").match(pattern) || [])];
}

function safeBackupName(value, fallback) {
  const safe = String(value || "")
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .trim()
    .slice(0, 80);
  return safe || fallback;
}

function backupImageExtension(url, contentType) {
  const types = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };
  if (types[contentType]) return types[contentType];
  const pathname = new URL(url).pathname;
  const match = pathname.match(/\.(jpe?g|png|webp|gif)$/i);
  return match ? `.${match[1].toLowerCase().replace("jpeg", "jpg")}` : ".img";
}

function markdownBackup(post, imageFiles) {
  let body = String(post.body || "");
  for (const [url, filename] of imageFiles) body = body.split(url).join(`../images/${filename}`);
  return [
    "---",
    `id: ${post.id}`,
    `title: ${JSON.stringify(post.title)}`,
    `category: ${JSON.stringify(post.category)}`,
    `published: ${JSON.stringify(post.published_label)}`,
    `createdAt: ${JSON.stringify(post.created_at)}`,
    `hidden: ${Boolean(post.hidden)}`,
    "---",
    "",
    body,
    ""
  ].join("\n");
}

app.get("/api/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", (req, res) => {
  const admin = readAdmin(req);
  res.json({ authenticated: Boolean(admin), username: admin?.sub || null });
});

app.post("/api/auth/login", loginLimiter, requireWebClient, async (req, res, next) => {
  try {
    const username = asText(req.body?.username, 80);
    const password = String(req.body?.password || "");
    const usernameMatches = crypto.timingSafeEqual(
      crypto.createHash("sha256").update(username).digest(),
      crypto.createHash("sha256").update(process.env.ADMIN_USERNAME).digest()
    );
    const passwordMatches = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    if (!usernameMatches || !passwordMatches) return res.status(401).json({ error: "用户名或密码不正确" });
    issueAdminCookie(res, process.env.ADMIN_USERNAME);
    res.json({ authenticated: true, username: process.env.ADMIN_USERNAME });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", requireWebClient, (_req, res) => {
  clearAdminCookie(res);
  res.status(204).end();
});

app.get("/api/posts", async (req, res, next) => {
  try {
    const includeHidden = req.query.includeHidden === "true" && Boolean(readAdmin(req));
    const result = await pool.query(`
      SELECT * FROM posts
      ${includeHidden ? "" : "WHERE hidden = FALSE"}
      ORDER BY sort_order DESC, id DESC
    `);
    res.json({ posts: result.rows.map(postFromRow) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/backups/download", backupLimiter, requireWebClient, requireAdmin, async (req, res, next) => {
  try {
    const [postsResult, commentsResult, messagesResult] = await Promise.all([
      pool.query("SELECT * FROM posts ORDER BY sort_order DESC, id DESC"),
      pool.query("SELECT * FROM comments ORDER BY created_at ASC"),
      pool.query("SELECT * FROM messages ORDER BY created_at ASC")
    ]);
    const generatedAt = new Date();
    const imageUrls = [...new Set(postsResult.rows.flatMap((post) => cloudinaryImageUrls(post.body)))];
    const imageFiles = new Map();
    const failedImages = [];
    const downloadedImages = [];
    const imageBuffers = [];

    for (const [index, url] of imageUrls.entries()) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const contentType = String(response.headers.get("content-type") || "").split(";")[0].toLowerCase();
        if (!contentType.startsWith("image/")) throw new Error("响应不是图片");
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length > 20 * 1024 * 1024) throw new Error("图片超过 20MB");
        const publicPart = decodeURIComponent(new URL(url).pathname.split("/").pop() || `image-${index + 1}`)
          .replace(/\.[a-zA-Z0-9]+$/, "");
        const filename = `${String(index + 1).padStart(3, "0")}-${safeBackupName(publicPart, "image")}${backupImageExtension(url, contentType)}`;
        imageFiles.set(url, filename);
        imageBuffers.push({ filename, buffer });
        downloadedImages.push({ sourceUrl: url, file: `images/${filename}`, bytes: buffer.length });
      } catch (error) {
        failedImages.push({ sourceUrl: url, error: error.message });
      }
    }

    const backupData = {
      format: "lorne-orbit-backup",
      version: 1,
      generatedAt: generatedAt.toISOString(),
      counts: {
        posts: postsResult.rowCount,
        comments: commentsResult.rowCount,
        messages: messagesResult.rowCount,
        images: downloadedImages.length
      },
      posts: postsResult.rows,
      comments: commentsResult.rows,
      messages: messagesResult.rows,
      images: downloadedImages,
      failedImages
    };

    const date = generatedAt.toISOString().slice(0, 10);
    res.status(200);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="lorne-orbit-backup-${date}.zip"`);
    res.setHeader("Cache-Control", "private, no-store");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("warning", (error) => console.warn("Backup archive warning", error));
    archive.on("error", (error) => res.destroy(error));
    archive.pipe(res);
    archive.append(JSON.stringify(backupData, null, 2), { name: "data/backup.json" });
    archive.append([
      "Lorne's orbit 博客备份",
      `生成时间：${generatedAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
      `文章：${postsResult.rowCount} 篇；评论：${commentsResult.rowCount} 条；留言：${messagesResult.rowCount} 条；图片：${downloadedImages.length} 张。`,
      "",
      "data/backup.json 是可用于程序恢复的完整数据。",
      "articles/ 包含可直接阅读的 Markdown 文章，图片链接已改为本地相对路径。",
      "images/ 包含文章在 Cloudinary 中引用的图片。",
      failedImages.length ? `有 ${failedImages.length} 张图片下载失败，详情见 data/backup.json 的 failedImages。` : "全部引用图片均已成功保存。",
      "请妥善保管此文件，其中可能包含评论者邮箱等个人信息。",
      ""
    ].join("\n"), { name: "README.txt" });
    postsResult.rows.forEach((post, index) => {
      const filename = `${String(index + 1).padStart(3, "0")}-${safeBackupName(post.title, `post-${post.id}`)}.md`;
      archive.append(markdownBackup(post, imageFiles), { name: `articles/${filename}` });
    });
    imageBuffers.forEach(({ filename, buffer }) => archive.append(buffer, { name: `images/${filename}` }));
    await archive.finalize();
  } catch (error) {
    if (res.headersSent) return res.destroy(error);
    next(error);
  }
});

app.get("/api/posts/:id/comments", requireArticleId, async (req, res, next) => {
  try {
    const post = await pool.query("SELECT hidden FROM posts WHERE id = $1", [req.params.id]);
    if (!post.rowCount || (post.rows[0].hidden && !readAdmin(req))) return res.status(404).json({ error: "文章不存在" });
    const result = await pool.query("SELECT * FROM comments WHERE article_id = $1 ORDER BY created_at ASC", [req.params.id]);
    res.json({ comments: result.rows.map(commentFromRow) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/posts", writeLimiter, requireWebClient, requireAdmin, async (req, res, next) => {
  try {
    const title = asText(req.body?.title, 120);
    const category = asText(req.body?.category, 50);
    const body = asText(req.body?.body, 200000);
    if (!title || !body || !allowedCategories.has(category)) return res.status(400).json({ error: "文章内容不完整" });
    const id = Date.now();
    const createdAt = new Date();
    const result = await pool.query(`
      INSERT INTO posts (id, category, published_label, created_at, sort_order, title, lead, excerpt, body, is_markdown)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE)
      RETURNING *
    `, [id, category, formatChineseDate(createdAt), createdAt, id, title, asText(req.body?.lead, 300), asText(req.body?.excerpt, 600), body]);
    res.status(201).json({ post: postFromRow(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/posts/:id", writeLimiter, requireWebClient, requireAdmin, requireArticleId, async (req, res, next) => {
  try {
    if (typeof req.body?.hidden !== "boolean") return res.status(400).json({ error: "缺少文章状态" });
    const result = await pool.query("UPDATE posts SET hidden = $1 WHERE id = $2 RETURNING *", [req.body.hidden, req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: "文章不存在" });
    res.json({ post: postFromRow(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/posts/:id", writeLimiter, requireWebClient, requireAdmin, requireArticleId, async (req, res, next) => {
  try {
    const existing = await pool.query("SELECT body FROM posts WHERE id = $1", [req.params.id]);
    if (!existing.rowCount) return res.status(404).json({ error: "文章不存在" });
    const result = await pool.query("DELETE FROM posts WHERE id = $1", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: "文章不存在" });
    await Promise.allSettled(cloudinaryPublicIds(existing.rows[0].body).map((publicId) => cloudinary.uploader.destroy(publicId)));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post("/api/posts/:id/comments", writeLimiter, requireWebClient, requireArticleId, async (req, res, next) => {
  try {
    const admin = readAdmin(req);
    const post = await pool.query("SELECT hidden FROM posts WHERE id = $1", [req.params.id]);
    if (!post.rowCount || (post.rows[0].hidden && !admin)) return res.status(404).json({ error: "文章不存在" });
    const id = crypto.randomUUID();
    const parentId = req.body?.parentId || null;
    const name = admin ? process.env.ADMIN_USERNAME : asText(req.body?.name, 40);
    const email = admin ? "" : asText(req.body?.email, 254).toLowerCase();
    const body = asText(req.body?.text, 1200);
    if (!name || !body || (!admin && !/^\S+@\S+\.\S+$/.test(email))) return res.status(400).json({ error: "评论内容或邮箱格式不正确" });
    if (parentId && !isUuid(parentId)) return res.status(400).json({ error: "回复的评论 ID 不正确" });
    if (parentId) {
      const parent = await pool.query("SELECT 1 FROM comments WHERE id = $1 AND article_id = $2", [parentId, req.params.id]);
      if (!parent.rowCount) return res.status(400).json({ error: "回复的评论不存在" });
    }
    const result = await pool.query(`
      INSERT INTO comments (id, article_id, parent_id, name, email, body, is_admin)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [id, req.params.id, parentId, name, email, body, Boolean(admin)]);
    res.status(201).json({ comment: commentFromRow(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/messages", async (_req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM messages ORDER BY created_at DESC LIMIT 30");
    res.json({ messages: result.rows.map(messageFromRow) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/messages", writeLimiter, requireWebClient, async (req, res, next) => {
  try {
    const name = asText(req.body?.name, 40, "一位路过的朋友") || "一位路过的朋友";
    const body = asText(req.body?.text, 300);
    if (!body) return res.status(400).json({ error: "留言不能为空" });
    const result = await pool.query("INSERT INTO messages (id, name, body) VALUES ($1,$2,$3) RETURNING *", [crypto.randomUUID(), name, body]);
    res.status(201).json({ message: messageFromRow(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/messages/:id", writeLimiter, requireWebClient, requireAdmin, requireUuid, async (req, res, next) => {
  try {
    await pool.query("DELETE FROM messages WHERE id = $1", [req.params.id]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    callback(null, /^image\/(?:jpeg|png|webp|gif)$/.test(file.mimetype));
  }
});

function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: process.env.CLOUDINARY_FOLDER || "lorne-orbit",
      resource_type: "image",
      transformation: [{ width: 1800, height: 1800, crop: "limit", quality: "auto", fetch_format: "auto" }],
      ...options
    }, (error, result) => error ? reject(error) : resolve(result));
    stream.end(buffer);
  });
}

app.post("/api/uploads", writeLimiter, requireWebClient, requireAdmin, upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "请选择有效图片" });
    if (!process.env.CLOUDINARY_CLOUD_NAME) return res.status(503).json({ error: "服务器尚未配置图片存储" });
    const result = await uploadBuffer(req.file.buffer);
    res.status(201).json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    next(error);
  }
});

app.post("/api/migrations/legacy", writeLimiter, requireWebClient, requireAdmin, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const incomingPosts = Array.isArray(req.body?.posts) ? req.body.posts.slice(0, 1000) : [];
    const images = req.body?.images && typeof req.body.images === "object" ? req.body.images : {};
    if (!incomingPosts.length) return res.status(400).json({ error: "没有可迁移的文章" });

    const imageUrls = {};
    for (const [imageId, image] of Object.entries(images).slice(0, 30)) {
      const data = String(image?.data || "");
      if (!/^data:image\/(?:jpeg|png|webp|gif);base64,/.test(data) || data.length > 5_500_000) continue;
      const uploaded = await cloudinary.uploader.upload(data, { folder: process.env.CLOUDINARY_FOLDER || "lorne-orbit", resource_type: "image" });
      imageUrls[imageId] = uploaded.secure_url;
    }

    await client.query("BEGIN");
    const baseOrder = Date.now();
    let imported = 0;
    for (const [index, post] of incomingPosts.entries()) {
      const id = Number(post.id);
      const title = asText(post.title, 120);
      const category = asText(post.category, 50);
      let body = asText(post.body, 200000);
      if (!Number.isSafeInteger(id) || !title || !body || !allowedCategories.has(category)) continue;
      body = body.replace(/local-image:\/\/([^)\s]+)/g, (match, imageId) => imageUrls[imageId] || match);
      await client.query(`
        INSERT INTO posts (id, category, published_label, created_at, sort_order, title, lead, excerpt, body, featured, hidden, is_markdown)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (id) DO UPDATE SET
          category=EXCLUDED.category, published_label=EXCLUDED.published_label, sort_order=EXCLUDED.sort_order,
          title=EXCLUDED.title, lead=EXCLUDED.lead, excerpt=EXCLUDED.excerpt, body=EXCLUDED.body,
          featured=EXCLUDED.featured, hidden=EXCLUDED.hidden, is_markdown=EXCLUDED.is_markdown
      `, [id, category, asText(post.date, 80, formatChineseDate()), post.createdAt || new Date(), baseOrder - index,
        title, asText(post.lead, 300), asText(post.excerpt, 600), body, Boolean(post.featured), Boolean(post.hidden), Boolean(post.isMarkdown)]);
      imported += 1;
    }
    await client.query("COMMIT");
    res.json({ imported, uploadedImages: Object.keys(imageUrls).length });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof multer.MulterError) return res.status(400).json({ error: "图片过大或上传格式不正确" });
  res.status(500).json({ error: process.env.NODE_ENV === "production" ? "服务器暂时无法处理请求" : error.message });
});

migrate()
  .then(() => app.listen(port, () => console.log(`Lorne's orbit API listening on port ${port}`)))
  .catch((error) => {
    console.error("Database migration failed", error);
    process.exit(1);
  });

module.exports = app;
