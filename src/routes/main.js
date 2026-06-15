const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Facility = require("../models/Facility");
const Reservation = require("../models/Reservation");
const User = require("../models/User");
const { checkLogin } = require("../middleware/auth");
const { CATEGORIES } = require("../utils/labels");

const mainLayout = "layouts/main";
const jwtSecret = process.env.JWT_SECRET;

const pad = (n) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/* -------------------------------------------------------------------------- */
/* 공개 / 유저                                                                 */
/* -------------------------------------------------------------------------- */

/** GET / , /home , /facilities — 활성 시설 목록 (검색 q + 카테고리 필터) */
router.get(
  ["/", "/home", "/facilities"],
  asyncHandler(async (req, res) => {
    const q = (req.query.q || "").trim();
    const category = req.query.category || "all";

    const filter = { isActive: true };
    if (category !== "all" && CATEGORIES.includes(category)) {
      filter.category = category;
    }
    if (q) filter.name = { $regex: q, $options: "i" };

    const facilities = await Facility.find(filter).sort({ createdAt: -1 });
    const [facilityCount, todayCount] = await Promise.all([
      Facility.countDocuments({ isActive: true }),
      Reservation.countDocuments({ date: todayStr(), status: "approved" }),
    ]);

    res.render("index", {
      layout: mainLayout,
      title: "하루예약 — 시설 예약 시스템",
      facilities,
      q,
      category,
      facilityCount,
      todayCount,
      active: "facilities",
    });
  })
);

/** 시설 상세를 렌더링하는 공용 헬퍼 (정상/에러 상황 공유) */
async function renderFacilityDetail(req, res, { facility, date, error, form }) {
  const reservations = await Reservation.find({
    facility: facility._id,
    date,
    status: { $in: ["approved", "pending"] },
  })
    .populate("user", "username")
    .sort({ startTime: 1 });

  res.render("facility", {
    layout: mainLayout,
    title: `${facility.name} — 하루예약`,
    facility,
    reservations,
    date,
    error: error || null,
    form: form || {},
    active: "facilities",
  });
}

/** GET /facilities/:id — 시설 상세 + 선택 날짜 예약 현황 + 신청 폼 */
router.get(
  "/facilities/:id",
  asyncHandler(async (req, res) => {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).redirect("/");
    const date = req.query.date || todayStr();
    await renderFacilityDetail(req, res, { facility, date });
  })
);

/** POST /reservations — 예약 신청 (로그인 필요, overlap 검사 후 pending 생성) */
router.post(
  "/reservations",
  checkLogin,
  asyncHandler(async (req, res) => {
    const { facilityId, date, startTime, endTime, purpose } = req.body;
    const facility = await Facility.findById(facilityId);
    if (!facility) return res.status(404).redirect("/");

    const form = { startTime, endTime, purpose };
    const fail = (error) =>
      renderFacilityDetail(req, res, { facility, date, error, form });

    // 유효성: 시간 순서 + 운영시간 범위
    if (!date || !startTime || !endTime) {
      return fail("날짜와 시작/종료 시간을 모두 입력해 주세요.");
    }
    if (endTime <= startTime) {
      return fail("종료 시간이 시작 시간보다 빠르거나 같습니다.");
    }
    if (startTime < facility.openTime || endTime > facility.closeTime) {
      return fail(
        `운영시간(${facility.openTime}~${facility.closeTime}) 안에서만 예약할 수 있습니다.`
      );
    }

    // 시간대 충돌 검사: 승인된 예약만 자리를 점유
    const conflict = await Reservation.findOne({
      facility: facilityId,
      date,
      status: "approved",
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });
    if (conflict) {
      return fail("이미 예약된 시간대입니다. 다른 시간을 선택해 주세요.");
    }

    await Reservation.create({
      facility: facilityId,
      user: res.locals.user.id,
      date,
      startTime,
      endTime,
      purpose: purpose || "",
      status: "pending",
    });

    res.redirect("/my/reservations");
  })
);

/** GET /my/reservations — 본인 예약 목록 */
router.get(
  "/my/reservations",
  checkLogin,
  asyncHandler(async (req, res) => {
    const reservations = await Reservation.find({ user: res.locals.user.id })
      .populate("facility", "name")
      .sort({ date: -1, startTime: 1 });

    res.render("my-reservations", {
      layout: mainLayout,
      title: "내 예약 — 하루예약",
      reservations,
      active: "my",
    });
  })
);

/** DELETE /reservations/:id — 본인 예약 취소 (pending/approved 만) */
router.delete(
  "/reservations/:id",
  checkLogin,
  asyncHandler(async (req, res) => {
    const reservation = await Reservation.findById(req.params.id);
    if (
      reservation &&
      reservation.user.toString() === res.locals.user.id &&
      ["pending", "approved"].includes(reservation.status)
    ) {
      reservation.status = "cancelled";
      await reservation.save();
    }
    res.redirect("/my/reservations");
  })
);

/* -------------------------------------------------------------------------- */
/* 인증                                                                        */
/* -------------------------------------------------------------------------- */

router.get("/login", (req, res) => {
  res.render("login", { layout: mainLayout, title: "로그인 — 하루예약", error: null });
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
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
    res.cookie("token", token, { httpOnly: true });
    res.redirect(user.role === "admin" ? "/admin" : "/");
  })
);

router.get("/register", (req, res) => {
  res.render("register", {
    layout: mainLayout,
    title: "회원가입 — 하루예약",
    error: null,
  });
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
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
  })
);

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;
