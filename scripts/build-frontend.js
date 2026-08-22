const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");
const apiUrl = String(process.env.BLOG_API_URL || "/api").replace(/\/$/, "");

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const file of ["index.html", "styles.css", "script.js", "api.js"]) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}
const publicDirectory = path.join(root, "public");
if (fs.existsSync(publicDirectory)) fs.cpSync(publicDirectory, output, { recursive: true });
fs.writeFileSync(
  path.join(output, "config.js"),
  `window.BLOG_CONFIG = Object.freeze(${JSON.stringify({ API_URL: apiUrl }, null, 2)});\n`,
  "utf8"
);
console.log(`Frontend built in ${output} with API ${apiUrl}`);
