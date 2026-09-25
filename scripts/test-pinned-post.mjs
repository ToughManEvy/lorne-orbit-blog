import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import worker from '../worker/index.mjs';

const db = new DatabaseSync(':memory:');
for (const name of ['0001_initial.sql', '0002_pinned_post.sql']) {
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
db.close();
console.log('PASS: admin-only pin, replacement, unique constraint, unpin, chronological order and ten-post pagination');
