const { Pool } = require("pg");

const useSsl = String(process.env.DATABASE_SSL).toLowerCase() === "true";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: Number(process.env.DATABASE_POOL_SIZE || 10)
});

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id BIGINT PRIMARY KEY,
      category VARCHAR(50) NOT NULL,
      published_label VARCHAR(80) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sort_order BIGINT NOT NULL,
      title VARCHAR(120) NOT NULL,
      lead TEXT NOT NULL DEFAULT '',
      excerpt TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      hidden BOOLEAN NOT NULL DEFAULT FALSE,
      is_markdown BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE INDEX IF NOT EXISTS posts_visibility_order_idx
      ON posts (hidden, sort_order DESC);

    CREATE TABLE IF NOT EXISTS comments (
      id UUID PRIMARY KEY,
      article_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
      name VARCHAR(40) NOT NULL,
      email VARCHAR(254) NOT NULL DEFAULT '',
      body VARCHAR(1200) NOT NULL,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS comments_article_created_idx
      ON comments (article_id, created_at ASC);

    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY,
      name VARCHAR(40) NOT NULL,
      body VARCHAR(300) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS messages_created_idx
      ON messages (created_at DESC);

    UPDATE posts
    SET published_label = '2026年7月20日 01:30',
        created_at = '2026-07-20 01:30:00+08'
    WHERE id = 1784482125815
      AND published_label = '2026年7月19日 17:28';
  `);
}

module.exports = { pool, migrate };
