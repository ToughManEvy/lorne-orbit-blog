(function createBlogApi(global) {
  const baseUrl = String(global.BLOG_CONFIG?.API_URL || "/api").replace(/\/$/, "");

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    if (options.method && options.method !== "GET") headers.set("X-Requested-With", "lorne-orbit-web");
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers, credentials: "include" });
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `请求失败（${response.status}）`);
    return payload;
  }

  global.blogApi = Object.freeze({
    getSession: () => request("/auth/me"),
    login: (username, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
    logout: () => request("/auth/logout", { method: "POST" }),
    getPosts: (includeHidden = false) => request(`/posts${includeHidden ? "?includeHidden=true" : ""}`),
    createPost: (post) => request("/posts", { method: "POST", body: JSON.stringify(post) }),
    updatePost: (id, changes) => request(`/posts/${id}`, { method: "PATCH", body: JSON.stringify(changes) }),
    deletePost: (id) => request(`/posts/${id}`, { method: "DELETE" }),
    getComments: (articleId) => request(`/posts/${articleId}/comments`),
    createComment: (articleId, comment) => request(`/posts/${articleId}/comments`, { method: "POST", body: JSON.stringify(comment) }),
    getMessages: () => request("/messages"),
    createMessage: (message) => request("/messages", { method: "POST", body: JSON.stringify(message) }),
    deleteMessage: (id) => request(`/messages/${id}`, { method: "DELETE" }),
    uploadImage: (file) => {
      const data = new FormData();
      data.append("image", file);
      return request("/uploads", { method: "POST", body: data });
    },
    migrateLegacy: (payload) => request("/migrations/legacy", { method: "POST", body: JSON.stringify(payload) })
  });
})(window);
