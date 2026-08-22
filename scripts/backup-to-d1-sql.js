const fs = require("node:fs");
const path = require("node:path");

const inputPath = process.env.BACKUP_JSON || path.join(".migration-backup-20260801", "data", "backup.json");
const outputPath = process.env.D1_IMPORT_FILE || "cloudflare-backup-import.sql";
const backup = JSON.parse(fs.readFileSync(inputPath, "utf8"));

if (backup.format !== "lorne-orbit-backup" || backup.version !== 1) {
  throw new Error("备份格式或版本不受支持。");
}

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

function insert(table, columns, rows) {
  return rows.map((row) => `INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${columns.map((column) => sql(row[column])).join(", ")});`).join("\n");
}

const imageMap = new Map((backup.images || []).map((image) => [String(image.sourceUrl), `/${String(image.file).replaceAll("\\", "/").replace(/^\/+/, "")}`]));
const posts = (backup.posts || []).map((post) => {
  let body = String(post.body || "");
  for (const [sourceUrl, localUrl] of imageMap) body = body.split(sourceUrl).join(localUrl);
  return { ...post, body };
});

const sections = [
  "PRAGMA foreign_keys = ON;",
  insert("posts", ["id", "category", "published_label", "created_at", "sort_order", "title", "lead", "excerpt", "body", "featured", "hidden", "is_markdown"], posts),
  insert("comments", ["id", "article_id", "parent_id", "name", "email", "body", "is_admin", "created_at"], backup.comments || []),
  insert("messages", ["id", "name", "body", "request_id", "created_at"], backup.messages || []),
  ""
];

fs.writeFileSync(outputPath, sections.filter(Boolean).join("\n"), "utf8");
const oldImageReferences = posts.reduce((count, post) => count + [...imageMap.keys()].filter((url) => post.body.includes(url)).length, 0);
console.log(`已生成 ${outputPath}：${posts.length} 篇文章、${backup.comments?.length || 0} 条评论、${backup.messages?.length || 0} 条留言、${imageMap.size} 张站内图片；残留旧图片链接 ${oldImageReferences} 个。`);
