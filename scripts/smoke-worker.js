const assert = require("node:assert/strict");

const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:8787/api";
const password = process.env.SMOKE_PASSWORD;
if (!password) throw new Error("SMOKE_PASSWORD is required");

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.arrayBuffer();
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path}: ${response.status} ${JSON.stringify(body)}`);
  return { response, body };
}

(async () => {
  assert.equal((await request("/health")).body.ok, true);
  const login = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "lorne-orbit-web" },
    body: JSON.stringify({ username: "Lorne", password })
  });
  assert.equal(login.body.authenticated, true);
  const authHeaders = { Authorization: `Bearer ${login.body.token}`, "X-Requested-With": "lorne-orbit-web" };
  const imageForm = new FormData();
  const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  imageForm.append("image", new Blob([imageBytes], { type: "image/png" }), "smoke.png");
  const uploaded = await request("/uploads", { method: "POST", headers: authHeaders, body: imageForm });
  assert.match(uploaded.body.url, /^\/uploads\/articles\//);
  const siteOrigin = new URL(baseUrl);
  siteOrigin.pathname = "/";
  const uploadedUrl = new URL(uploaded.body.url, siteOrigin);
  const uploadedImage = await fetch(uploadedUrl);
  assert.equal(uploadedImage.status, 200);
  assert.equal(uploadedImage.headers.get("content-type"), "image/png");
  const created = await request("/posts", {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Cloudflare 冒烟测试", category: "杂谈集", body: `测试正文\n\n![测试图片](${uploaded.body.url})` })
  });
  const postId = created.body.post.id;
  assert.ok((await request("/posts")).body.posts.some((post) => post.id === postId));
  const edited = await request(`/posts/${postId}`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Cloudflare 冒烟测试（已修改）", category: "心情日记", body: `修改后的正文\n\n![测试图片](${uploaded.body.url})` })
  });
  assert.equal(edited.body.post.title, "Cloudflare 冒烟测试（已修改）");
  assert.equal(edited.body.post.category, "心情日记");
  assert.match(edited.body.post.body, /修改后的正文/);
  const comment = await request(`/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "lorne-orbit-web" },
    body: JSON.stringify({ name: "测试访客", email: "test@example.com", text: "测试评论" })
  });
  assert.equal(comment.body.comment.articleId, postId);
  const requestId = crypto.randomUUID();
  const messageOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "lorne-orbit-web", "Idempotency-Key": requestId },
    body: JSON.stringify({ name: "测试访客", text: "测试留言" })
  };
  const firstMessage = await request("/messages", messageOptions);
  const secondMessage = await request("/messages", messageOptions);
  assert.equal(firstMessage.body.message.id, secondMessage.body.message.id);
  await request(`/messages/${firstMessage.body.message.id}/delete`, { method: "POST", headers: authHeaders });
  const backup = await request("/backups/download", { headers: authHeaders });
  assert.equal(backup.response.headers.get("content-type"), "application/zip");
  assert.ok(backup.body.byteLength > 100);
  await request(`/posts/${postId}`, { method: "DELETE", headers: authHeaders });
  let deletedImageStatus = 200;
  for (let attempt = 0; attempt < 10 && deletedImageStatus !== 404; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const deletionProbe = new URL(uploadedUrl);
    deletionProbe.searchParams.set("deleted-probe", String(attempt));
    deletedImageStatus = (await fetch(deletionProbe, { cache: "no-store" })).status;
  }
  assert.equal(deletedImageStatus, 404);
  console.log("Worker smoke test passed: health, auth, R2 upload/read/delete, post editing, comments, messages, backup, cleanup.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
