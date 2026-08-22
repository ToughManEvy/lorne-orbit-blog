const fs = require("node:fs");
const { Client } = require("pg");

const connectionString = process.env.SOURCE_DATABASE_URL;
const outputPath = process.env.D1_EXPORT_FILE || "cloudflare-export.sql";
if (!connectionString) {
  console.error("缺少 SOURCE_DATABASE_URL。请设置为恢复后的 Render PostgreSQL 外部连接地址。");
  process.exit(1);
}

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  if (value instanceof Date) value = value.toISOString();
  return `'${String(value).replaceAll("'", "''")}'`;
}

function insert(table, columns, rows) {
  if (!rows.length) return "";
  return rows.map((row) => `INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${columns.map((column) => sql(row[column])).join(", ")});`).join("\n");
}

(async () => {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const [posts, comments, messages] = await Promise.all([
      client.query("SELECT * FROM posts ORDER BY sort_order ASC, id ASC"),
      client.query("SELECT * FROM comments ORDER BY created_at ASC"),
      client.query("SELECT * FROM messages ORDER BY created_at ASC")
    ]);
    const sections = [
      "PRAGMA foreign_keys = ON;",
      "BEGIN TRANSACTION;",
      insert("posts", ["id", "category", "published_label", "created_at", "sort_order", "title", "lead", "excerpt", "body", "featured", "hidden", "is_markdown"], posts.rows),
      insert("comments", ["id", "article_id", "parent_id", "name", "email", "body", "is_admin", "created_at"], comments.rows),
      insert("messages", ["id", "name", "body", "request_id", "created_at"], messages.rows),
      "COMMIT;",
      ""
    ];
    fs.writeFileSync(outputPath, sections.filter(Boolean).join("\n"), "utf8");
    console.log(`已导出 ${posts.rowCount} 篇文章、${comments.rowCount} 条评论、${messages.rowCount} 条留言到 ${outputPath}`);
  } finally {
    await client.end();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
