import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import worker from '../worker/index.mjs';

const db = new DatabaseSync(':memory:');
for (const name of ['0001_initial.sql', '0002_pinned_post.sql', '0003_analytics.sql']) {
  db.exec(readFileSync(new URL(`../worker/migrations/${name}`, import.meta.url), 'utf8'));
}
const wrap = (sql, values = []) => ({
  bind: (...args) => wrap(sql, args),
  first: async () => db.prepare(sql).get(...values),
  all: async () => ({ results: db.prepare(sql).all(...values) }),
  run: async () => ({ meta: db.prepare(sql).run(...values) })
});
const env = {
  DB: { prepare: wrap, async batch(statements) {
    db.exec('BEGIN');
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      db.exec('COMMIT');
      return results;
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  } },
  ADMIN_USERNAME: 'test', ADMIN_PASSWORD_HASH: createHash('sha256').update('test-only').digest('hex'),
  JWT_SECRET: 'local-test-secret', FRONTEND_ORIGINS: 'https://blog.test'
};
for (let id = 1; id <= 21; id++) {
  db.prepare(`INSERT INTO posts (id, category, published_label, created_at, sort_order, title, body)
    VALUES (?, '杂谈集', 'today', '2026-09-25', ?, ?, 'content')`).run(id, id, `Post ${id}`);
}
let token = '';
async function request(path, method = 'GET', body) {
  return worker.fetch(new Request(`https://blog.test/api${path}`, {
    method, headers: { 'X-Requested-With': 'lorne-orbit-web', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {})
  }), env, {});
}
assert.equal((await request('/posts/1', 'PATCH', { pinned: true })).status, 401);
token = (await (await request('/auth/login', 'POST', { username: 'test', password: 'test-only' })).json()).token;
assert.ok(token);
for (const id of [1, 2, 1]) {
  assert.equal((await request(`/posts/${id}`, 'PATCH', { pinned: true })).status, 200);
  const { posts } = await (await request('/posts')).json();
  assert.equal(posts[0].id, id);
  assert.equal(posts.filter(post => post.pinned).length, 1);
  const size = Number(readFileSync(new URL('../script.js', import.meta.url), 'utf8').match(/const PAGE_SIZE = (\d+)/)[1]);
  assert.equal(posts.slice(0, size).slice(1).length, 9);
  assert.equal(new Set(posts.map(post => post.id)).size, 21);
}
assert.throws(() => db.exec('UPDATE posts SET pinned = 1 WHERE id = 3'));
assert.equal((await request('/posts/999', 'PATCH', { pinned: true })).status, 404);
assert.equal((await request('/posts/1', 'PATCH', { pinned: 'yes' })).status, 400);
assert.equal((await request('/posts/1', 'PATCH', { pinned: false })).status, 200);
const { posts } = await (await request('/posts')).json();
assert.equal(posts[0].id, 21);
assert.equal(posts.filter(post => post.pinned).length, 0);
const adminToken = token;
const visitor = 'test-visitor-123456789';
assert.equal((await (await request('/analytics/view', 'POST', { page: 'post-1', visitor })).json()).counted, false, 'Admin traffic excluded');
token = '';
assert.equal((await request('/admin/analytics')).status, 401, 'Stats require admin');
for (const page of ['home', 'post-1', 'post-1']) {
  assert.equal((await request('/analytics/view', 'POST', { page, visitor })).status, 200);
}
assert.equal(db.prepare('SELECT views FROM posts WHERE id=1').get().views, 1, 'Repeat reads deduplicated');
assert.equal((await request('/analytics/view', 'POST', { page: 'post-1', visitor: 'another-visitor-123456' })).status, 200);
assert.equal(db.prepare('SELECT views FROM posts WHERE id=1').get().views, 2);
db.exec('UPDATE posts SET hidden=1 WHERE id=2');
assert.equal((await request('/analytics/view', 'POST', { page: 'post-2', visitor })).status, 404, 'Hidden post not counted for visitors');
assert.equal((await request('/analytics/view', 'POST', { page: 'post-999', visitor })).status, 404);
assert.equal((await request('/analytics/view', 'POST', { page: 'manage', visitor })).status, 400);
assert.equal((await request('/analytics/view', 'POST', { page: 'home', visitor: 'bad' })).status, 400);
const publicPosts = await (await request('/posts')).json();
assert.equal(publicPosts.posts.find(post => post.id === 1).views, 2);
token = adminToken;
const stats = await (await request('/admin/analytics')).json();
assert.equal(stats.today.visitors, 2);
assert.equal(stats.today.views, 3);
assert.equal(stats.totals.articleViews, 2);
assert.equal(stats.topPosts[0].id, 1);
assert.equal(stats.counts.posts, 21);
assert.equal(stats.trend.length, 1);
assert.ok(!JSON.stringify(stats).includes(visitor), 'Stats never expose anonymous IDs');
db.close();
console.log('PASS: analytics permissions, admin exclusion, duplicate views, distinct browsers, hidden posts, public counts, dashboard totals');
console.log('PASS: admin-only pin, replacement, unique constraint, unpin, chronological order and ten-post pagination');
