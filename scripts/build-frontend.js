const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");
const apiUrl = String(process.env.BLOG_API_URL || "").replace(/\/$/, "");
const apiOrigin = String(process.env.BLOG_API_ORIGIN || "").replace(/\/$/, "");

if (!apiUrl) {
  console.error("BLOG_API_URL is required, for example https://your-api.onrender.com/api");
  process.exit(1);
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const file of ["index.html", "styles.css", "script.js", "api.js"]) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}
fs.writeFileSync(
  path.join(output, "config.js"),
  `window.BLOG_CONFIG = Object.freeze(${JSON.stringify({ API_URL: apiUrl }, null, 2)});\n`,
  "utf8"
);
if (apiUrl === "/api") {
  if (!apiOrigin.startsWith("https://")) {
    console.error("BLOG_API_ORIGIN must be an HTTPS origin when BLOG_API_URL=/api");
    process.exit(1);
  }
  fs.writeFileSync(path.join(output, "_redirects"), `/api/*  ${apiOrigin}/api/:splat  200\n`, "utf8");
}
console.log(`Frontend built in ${output} with API ${apiUrl}`);
