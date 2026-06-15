const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");

const Facility = require("../models/Facility");
const Reservation = require("../models/Reservation");
const { checkAdmin } = require("../middleware/auth");
const { CATEGORIES } = require("../utils/labels");

const adminLayout = "layouts/admin";

const pad = (n) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// 모든 관리자 라우트는 admin 권한 필요
router.use(checkAdmin);

/* ------------------------------- 대시보드 -------------------------------- */
router.get(
  "/admin",
  asyncHandler(async (req, res) => {
    const [pendingCount, facilityCount, todayCount, pendingReservations] =
      await Promise.all([
        Reservation.countDocuments({ status: "pending" }),
        Facility.countDocuments({}),
        Reservation.countDocuments({ date: todayStr() }),
        Reservation.find({ status: "pending" })
          .populate("facility", "name")
          .populate("user", "username")
          .sort({ createdAt: -1 })
          .limit(8),
      ]);

    res.render("admin/index", {
      layout: adminLayout,
      title: "관리자 대시보드 — 하루예약",
      pendingCount,
      facilityCount,
      todayCount,
      pendingReservations,
      adminActive: "dashboard",
    });
  })
);

/* ------------------------------ 시설 관리 -------------------------------- */
router.get(
  "/admin/facilities",
  asyncHandler(async (req, res) => {
    const facilities = await Facility.find({}).sort({ createdAt: -1 });
    res.render("admin/facilities", {
      layout: adminLayout,
      title: "시설 관리 — 하루예약",
      facilities,
      adminActive: "facilities",
    });
  })
);

router.get("/admin/facilities/new", (req, res) => {
  res.render("admin/facility-form", {
    layout: adminLayout,
    title: "시설 추가 — 하루예약",
    facility: null,
    adminActive: "facilities",
  });
});

const parseFacilityBody = (body) => ({
  name: (body.name || "").trim(),
  category: CATEGORIES.includes(body.category) ? body.category : "etc",
  description: (body.description || "").trim(),
  capacity: Math.max(1, parseInt(body.capacity, 10) || 1),
  openTime: body.openTime || "09:00",
  closeTime: body.closeTime || "22:00",
  isActive: body.isActive === "true" || body.isActive === "on",
});

router.post(
  "/admin/facilities",
  asyncHandler(async (req, res) => {
    await Facility.create(parseFacilityBody(req.body));
    res.redirect("/admin/facilities");
  })
);

router.get(
  "/admin/facilities/:id/edit",
  asyncHandler(async (req, res) => {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.redirect("/admin/facilities");
    res.render("admin/facility-form", {
      layout: adminLayout,
      title: "시설 수정 — 하루예약",
      facility,
      adminActive: "facilities",
    });
  })
);

router.put(
  "/admin/facilities/:id",
  asyncHandler(async (req, res) => {
    await Facility.findByIdAndUpdate(req.params.id, parseFacilityBody(req.body));
    res.redirect("/admin/facilities");
  })
);

router.delete(
  "/admin/facilities/:id",
  asyncHandler(async (req, res) => {
    await Facility.findByIdAndDelete(req.params.id);
    res.redirect("/admin/facilities");
  })
);

/* ------------------------------ 예약 관리 -------------------------------- */
router.get(
  "/admin/reservations",
  asyncHandler(async (req, res) => {
    const status = req.query.status || "pending";
    const filter = status === "all" ? {} : { status };

    const reservations = await Reservation.find(filter)
      .populate("facility", "name")
      .populate("user", "username")
      .sort({ createdAt: -1 });

    const [pending, approved, rejected, cancelled, all] = await Promise.all([
      Reservation.countDocuments({ status: "pending" }),
      Reservation.countDocuments({ status: "approved" }),
      Reservation.countDocuments({ status: "rejected" }),
      Reservation.countDocuments({ status: "cancelled" }),
      Reservation.countDocuments({}),
    ]);

    res.render("admin/reservations", {
      layout: adminLayout,
      title: "예약 관리 — 하루예약",
      reservations,
      status,
      counts: { pending, approved, rejected, cancelled, all },
      error: req.query.error || null,
      adminActive: "reservations",
    });
  })
);

router.put(
  "/admin/reservations/:id/approve",
  asyncHandler(async (req, res) => {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.redirect("/admin/reservations");

    // 승인 시 overlap 재검사 (자기 자신 제외)
    const conflict = await Reservation.findOne({
      facility: reservation.facility,
      date: reservation.date,
      status: "approved",
      _id: { $ne: reservation._id },
      startTime: { $lt: reservation.endTime },
      endTime: { $gt: reservation.startTime },
    });
    if (conflict) {
      const msg = encodeURIComponent(
        "해당 시간대에 이미 승인된 예약이 있어 승인할 수 없습니다."
      );
      return res.redirect(`/admin/reservations?status=pending&error=${msg}`);
    }

    reservation.status = "approved";
    await reservation.save();
    res.redirect("/admin/reservations");
  })
);

router.put(
  "/admin/reservations/:id/reject",
  asyncHandler(async (req, res) => {
    const reservation = await Reservation.findById(req.params.id);
    if (reservation) {
      reservation.status = "rejected";
      reservation.rejectReason = (req.body.rejectReason || "").trim();
      await reservation.save();
    }
    res.redirect("/admin/reservations");
  })
);

module.exports = router;
