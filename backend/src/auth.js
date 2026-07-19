const jwt = require("jsonwebtoken");

const COOKIE_NAME = "lorne_orbit_admin";

function readAdmin(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "lorne-orbit-api",
      audience: "lorne-orbit-admin"
    });
  } catch {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const admin = readAdmin(req);
  if (!admin) return res.status(401).json({ error: "需要管理员登录" });
  req.admin = admin;
  next();
}

function issueAdminCookie(res, username) {
  const token = jwt.sign({ sub: username, role: "admin" }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "8h",
    issuer: "lorne-orbit-api",
    audience: "lorne-orbit-admin"
  });
  const production = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: production,
    sameSite: production ? "none" : "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/"
  });
}

function clearAdminCookie(res) {
  const production = process.env.NODE_ENV === "production";
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: production,
    sameSite: production ? "none" : "lax",
    path: "/"
  });
}

module.exports = { readAdmin, requireAdmin, issueAdminCookie, clearAdminCookie };
