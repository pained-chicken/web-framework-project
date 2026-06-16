const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const mainLayout = "layouts/main";
const jwtSecret = process.env.JWT_SECRET;

/** GET /login */
const getLogin = (req, res) => {
  res.render("login", { layout: mainLayout, title: "로그인 — 하루예약", error: null });
};

/** POST /login */
const postLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const fail = () =>
    res.status(401).render("login", {
      layout: mainLayout,
      title: "로그인 — 하루예약",
      error: "아이디 또는 비밀번호가 올바르지 않습니다.",
    });

  const user = await User.findOne({ username });
  if (!user) return fail();
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return fail();

  const token = jwt.sign(
    { id: user._id, role: user.role, username: user.username },
    jwtSecret
  );
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000, // 1일
  });
  res.redirect(user.role === "admin" ? "/admin" : "/");
});

/** GET /register */
const getRegister = (req, res) => {
  res.render("register", {
    layout: mainLayout,
    title: "회원가입 — 하루예약",
    error: null,
  });
};

/** POST /register */
const postRegister = asyncHandler(async (req, res) => {
  const { username, password, passwordConfirm } = req.body;
  const fail = (error) =>
    res.status(400).render("register", {
      layout: mainLayout,
      title: "회원가입 — 하루예약",
      error,
    });

  if (!username || username.length < 4) {
    return fail("아이디는 4자 이상이어야 합니다.");
  }
  if (!password || password.length < 8) {
    return fail("비밀번호는 8자 이상이어야 합니다.");
  }
  if (password !== passwordConfirm) {
    return fail("비밀번호가 일치하지 않습니다.");
  }
  const exists = await User.findOne({ username });
  if (exists) return fail("이미 사용 중인 아이디입니다.");

  const hash = await bcrypt.hash(password, 10);
  await User.create({ username, password: hash, role: "user" });
  res.redirect("/login");
});

/** POST /logout */
const logout = (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
};

module.exports = { getLogin, postLogin, getRegister, postRegister, logout };
