# Lorne's orbit

这是一个部署在 Cloudflare 上的个人博客：静态页面由 Workers Static Assets 提供，API 运行在 Cloudflare Worker，文章、评论和留言保存在 D1，恢复的历史图片作为站内静态资源发布，新上传的图片保存在 R2。

## 架构

```text
浏览器 ── 同源 /api ── Cloudflare Worker ── D1（文章、评论、留言）
   └── 静态资源 ───── Workers Static Assets
管理员上传图片 ───── Worker ── R2
```

主要文件：

- `worker/index.mjs`：Cloudflare API
- `worker/migrations/0001_initial.sql`：D1 表结构
- `wrangler.jsonc`：Cloudflare 部署配置
- `scripts/postgres-to-d1-sql.js`：从原 Render PostgreSQL 导出 D1 导入文件
- `api.js`：浏览器 API 客户端
- `scripts/build-frontend.js`：静态前端构建

## 本地运行

要求 Node.js 20+。

```powershell
npm install
Copy-Item .dev.vars.example .dev.vars
npm run hash-password
```

把生成的哈希填入 `.dev.vars` 的 `ADMIN_PASSWORD_HASH`，再填写至少 32 个字符的 `JWT_SECRET`。本地 Wrangler 会按照 `wrangler.jsonc` 自动创建本地 R2 存储。

```powershell
npm run dev
```

本地地址为 `http://127.0.0.1:8787`。`.dev.vars` 已被 Git 忽略，不能把真实密钥提交到仓库。

## 首次部署到 Cloudflare

### 1. 登录并创建 D1

```powershell
npx wrangler login
npx wrangler d1 create lorne-orbit
```

把命令返回的 `database_id` 替换到 `wrangler.jsonc`，然后执行：

```powershell
npx wrangler d1 migrations apply lorne-orbit --remote
```

### 2. 配置密钥

生成管理员密码哈希并逐项粘贴到 Wrangler：

```powershell
npm run hash-password
npx wrangler secret put ADMIN_PASSWORD_HASH
npx wrangler secret put JWT_SECRET
```

`JWT_SECRET` 应使用至少 32 字节的随机值。`ADMIN_USERNAME` 是非敏感配置，保存在 `wrangler.jsonc`。部署前还需要创建与配置文件同名的 R2 存储桶：

```powershell
npx wrangler r2 bucket create lorne-orbit-images
```

### 3. 恢复博客数据

如果有“完整备份到本地”生成的 ZIP，解压后把 `data/backup.json` 路径传给恢复脚本，并将 ZIP 的 `images/` 复制到 `public/images/`：

```powershell
$env:BACKUP_JSON="解压目录\data\backup.json"
npm run import:backup
npx wrangler d1 execute lorne-orbit --remote --file cloudflare-backup-import.sql
Remove-Item Env:BACKUP_JSON
```

脚本会把备份中的 Cloudinary URL 改写为 `/images/文件名`。生成的 SQL 已被 Git 忽略，其中可能包含评论者邮箱。

如果没有 ZIP，但原 Render PostgreSQL 仍可连接，也可从数据库导出：

必须先在 Render 宽限期内恢复原 PostgreSQL，取得 External Database URL。不要把 URL 写进文件或提交到 Git。

```powershell
$env:SOURCE_DATABASE_URL="Render PostgreSQL External Database URL"
npm run export:d1
npx wrangler d1 execute lorne-orbit --remote --file cloudflare-export.sql
Remove-Item Env:SOURCE_DATABASE_URL
```

生成的 `cloudflare-export.sql` 已被 Git 忽略。导入完成后应将它移到安全备份位置或删除，因为其中可能含有评论者邮箱。

### 4. 发布

```powershell
npm run deploy
```

Worker、静态站点和 API 会发布在同一个 `workers.dev` 地址。之后可在 Cloudflare Dashboard 为 Worker 添加自定义域名。

## 本地验证

应用 D1 migration 后，启动本地 Worker，再在另一个终端执行：

```powershell
$env:SMOKE_PASSWORD="本地 .dev.vars 对应的原始密码"
npm run smoke
Remove-Item Env:SMOKE_PASSWORD
```

冒烟测试覆盖健康检查、登录、R2 图片上传与删除、文章、评论、留言幂等、留言删除、ZIP 备份和测试数据清理。

## 安全与备份

- 管理员密码仅以 SHA-256 哈希保存在 Cloudflare Secret 中，并配合 D1 登录限流。请使用随机且不复用的长密码。
- 登录令牌为 8 小时有效的 HS256 JWT，同时支持 HttpOnly Cookie 与标签页内 Bearer Token。
- 所有写接口要求自定义请求头并执行 D1 限流。
- 评论者邮箱保存在 D1，但公开接口不会返回邮箱。
- 管理员页面的“完整备份到本地”会生成 ZIP，其中包含数据库 JSON、Markdown 文章及文章引用的站内、R2 或旧 Cloudinary 图片。
- 建议定期下载 ZIP；免费服务不等同于备份服务。
