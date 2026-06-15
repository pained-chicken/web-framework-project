const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

/**
 * loadUser — runs on every request. Decodes the JWT cookie (if any) and exposes
 * the payload as res.locals.user so all views can branch on login state / role.
 * Payload shape: { id, role, username }.
 */
const loadUser = (req, res, next) => {
  res.locals.user = null;
  const token = req.cookies && req.cookies.token;
  if (token) {
    try {
      res.locals.user = jwt.verify(token, jwtSecret);
    } catch (error) {
      res.clearCookie("token");
    }
  }
  next();
};

/** checkLogin — requires any logged-in user. */
const checkLogin = (req, res, next) => {
  if (!res.locals.user) return res.redirect("/login");
  next();
};

/** checkAdmin — requires a logged-in user with the admin role. */
const checkAdmin = (req, res, next) => {
  if (!res.locals.user) return res.redirect("/login");
  if (res.locals.user.role !== "admin") {
    return res.status(403).render("error", {
      layout: "layouts/main",
      title: "접근 권한 없음",
      message: "관리자만 접근할 수 있는 페이지입니다.",
    });
  }
  next();
};

module.exports = { loadUser, checkLogin, checkAdmin };
