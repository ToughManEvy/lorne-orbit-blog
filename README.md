# Lorne's orbit

这是一个前后端分离的个人博客：静态前端可以部署到 Netlify，Express API 可以部署到 Render，公开数据保存在 PostgreSQL，文章图片保存在 Cloudinary。

## 目录与数据流

```text
浏览器（HTML/CSS/JavaScript）
  ├─ HTTPS API → Express → PostgreSQL（文章、评论、留言）
  └─ 管理员上传 → Express → Cloudinary（文章图片）
```

- 前端入口：`index.html`
- API 客户端：`api.js`
- 本地 API 地址：`config.js`
- 后端服务：`backend/src/server.js`
- 数据表初始化：`backend/src/db.js`
- Render 配置：`render.yaml`
- Netlify 配置：`netlify.toml`

## 本地运行

要求 Node.js 20+、Docker Desktop，以及 VS Code Live Server。

1. 启动 PostgreSQL：

   ```powershell
   docker compose up -d
   ```

2. 配置并启动 API：

   ```powershell
   Copy-Item backend\.env.example backend\.env
   Set-Location backend
   npm install
   npm run hash-password -- "换成至少12位的强密码"
   ```

   把输出的哈希填入 `backend/.env` 的 `ADMIN_PASSWORD_HASH`，同时替换 `JWT_SECRET`。如需上传图片，还要填写 Cloudinary 配置。然后运行：

   ```powershell
   npm run dev
   ```

3. 用 Live Server 打开 `index.html`。建议始终使用 `http://127.0.0.1:5500`，它已经列入后端开发跨域白名单。

## 迁移原来浏览器里的文章

先用原来保存过文章的同一个 Live Server 地址打开博客。登录管理员后点击顶部的“迁移旧文章”。前端会把：

- 8 篇内置文章；
- `lorne-orbit-custom-posts` 中的本地文章；
- `lorne-orbit-post-images` 中的文章图片；
- 原来的隐藏/删除状态；

一次性上传到服务器。迁移使用文章 ID 执行 upsert，重复点击不会产生重复文章。不要在迁移成功前清理浏览器网站数据。

## 部署到公网

### 1. Cloudinary

创建 Cloudinary 账户并取得 Cloud name、API key、API secret。它们只配置在后端，不能写进前端文件。

### 2. Render：API 与 PostgreSQL

将代码推送到 GitHub，在 Render 中使用仓库根目录的 `render.yaml` 创建 Blueprint。配置默认使用 Render 免费实例，并关闭 PostgreSQL 公网入口；需要更稳定的可用性时可以在控制台升级。创建时填写：

- `FRONTEND_ORIGINS`：最终前端地址，例如 `https://your-blog.netlify.app`，不要带末尾 `/`；
- `ADMIN_PASSWORD_HASH`：在本地用 `npm run hash-password` 生成；
- 三个 `CLOUDINARY_*` 变量。

部署完成后记录 API 来源地址，例如 `https://lorne-orbit-api.onrender.com`。

### 3. Netlify：静态前端

在 Netlify 中导入同一个仓库。`netlify.toml` 已设置构建命令和发布目录。增加环境变量：

```text
BLOG_API_URL=/api
BLOG_API_ORIGIN=https://lorne-orbit-api.onrender.com
```

构建脚本会生成 Netlify 反向代理规则。浏览器只访问同源 `/api`，Netlify 再把请求转发给独立的 Render API；这样管理员 Cookie 不会被当成第三方 Cookie。

首次部署后，把最终 Netlify 域名填回 Render 的 `FRONTEND_ORIGINS`，重新部署 API。如果同时使用自定义域名，可以用英文逗号添加多个精确来源。

## 安全与运维

- 管理员密码只以 bcrypt 哈希形式存放在后端环境变量中。
- 登录凭证是 8 小时有效的 HttpOnly、Secure Cookie，前端 JavaScript 无法读取。
- 后端限制跨域来源、写入频率、上传类型和上传大小。
- 评论者邮箱保存在数据库，但 API 不向公众返回邮箱。
- PostgreSQL 和 Cloudinary 都应开启各自的备份或保留策略。
- 修改前端域名后，必须同步更新 `FRONTEND_ORIGINS`。
