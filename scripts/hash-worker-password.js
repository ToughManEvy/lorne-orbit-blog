const crypto = require("node:crypto");
function readHidden(prompt) {
  if (!process.stdin.isTTY) {
    return new Promise((resolve) => {
      let input = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => { input += chunk; });
      process.stdin.on("end", () => resolve(input.replace(/[\r\n]+$/, "")));
    });
  }
  return new Promise((resolve) => {
    const input = process.stdin;
    const output = process.stdout;
    output.write(prompt);
    input.setRawMode(true);
    input.resume();
    let value = "";
    const onData = (buffer) => {
      const char = buffer.toString("utf8");
      if (char === "\u0003") process.exit(130);
      if (char === "\r" || char === "\n") {
        input.setRawMode(false);
        input.off("data", onData);
        input.pause();
        output.write("\n");
        resolve(value);
      } else if (char === "\u007f" || char === "\b") {
        value = value.slice(0, -1);
      } else if (char >= " ") {
        value += char;
      }
    };
    input.on("data", onData);
  });
}

(async () => {
  const password = await readHidden("管理员密码（输入不会显示）：");
  if (password.length < 12) throw new Error("密码至少需要 12 个字符。");
  console.log(crypto.createHash("sha256").update(password, "utf8").digest("hex"));
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
