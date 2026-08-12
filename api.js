(function createBlogApi(global) {
  const baseUrl = String(global.BLOG_CONFIG?.API_URL || "/api").replace(/\/$/, "");
  const adminTokenKey = "lorne-orbit-admin-session";
  let adminToken = "";

  try {
    adminToken = sessionStorage.getItem(adminTokenKey) || "";
  } catch {
    adminToken = "";
  }

  function rememberAdminToken(token) {
    adminToken = String(token || "");
    try {
      if (adminToken) sessionStorage.setItem(adminTokenKey, adminToken);
      else sessionStorage.removeItem(adminTokenKey);
    } catch {
      // The in-memory token still supports this tab when storage is unavailable.
    }
  }

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    if (options.method && options.method !== "GET") headers.set("X-Requested-With", "lorne-orbit-web");
    if (adminToken) headers.set("Authorization", `Bearer ${adminToken}`);
    const timeout = Number(options.timeout) || 0;
    const controller = timeout && !options.signal ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeout) : null;
    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...options,
        timeout: undefined,
        headers,
        credentials: "include",
        signal: options.signal || controller?.signal
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `请求失败（${response.status}）`);
    return payload;
  }

  async function downloadBackup() {
    const response = await fetch(`${baseUrl}/backups/download`, {
      headers: { "X-Requested-With": "lorne-orbit-web" },
      credentials: "include"
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `备份失败（${response.status}）`);
    }
    return response.blob();
  }

  global.blogApi = Object.freeze({
    getSession: (options) => request("/auth/me", options),
    login: async (username, password) => {
      const session = await request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
      rememberAdminToken(session.token);
      return session;
    },
    logout: async () => {
      try {
        return await request("/auth/logout", { method: "POST" });
      } finally {
        rememberAdminToken("");
      }
    },
    getPosts: (includeHidden = false, options) => request(`/posts${includeHidden ? "?includeHidden=true" : ""}`, options),
    createPost: (post) => request("/posts", { method: "POST", body: JSON.stringify(post) }),
    updatePost: (id, changes) => request(`/posts/${id}`, { method: "PATCH", body: JSON.stringify(changes) }),
    deletePost: (id) => request(`/posts/${id}`, { method: "DELETE" }),
    getComments: (articleId) => request(`/posts/${articleId}/comments`),
    createComment: (articleId, comment) => request(`/posts/${articleId}/comments`, { method: "POST", body: JSON.stringify(comment) }),
    getMessages: (options) => request("/messages", options),
    createMessage: (message, requestId) => request("/messages", {
      method: "POST",
      headers: { "Idempotency-Key": requestId },
      body: JSON.stringify(message)
    }),
    deleteMessage: (id) => request(`/messages/${encodeURIComponent(id)}/delete`, { method: "POST" }),
    uploadImage: (file) => {
      const data = new FormData();
      data.append("image", file);
      return request("/uploads", { method: "POST", body: data });
    },
    downloadBackup,
    migrateLegacy: (payload) => request("/migrations/legacy", { method: "POST", body: JSON.stringify(payload) })
  });
})(window);
