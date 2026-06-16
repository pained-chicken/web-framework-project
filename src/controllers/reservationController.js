const asyncHandler = require("express-async-handler");

const Facility = require("../models/Facility");
const Reservation = require("../models/Reservation");
const { renderFacilityDetail } = require("./facilityController");

/** POST /reservations — 예약 신청 (로그인 필요, overlap 검사 후 pending 생성) */
const createReservation = asyncHandler(async (req, res) => {
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
});

/** GET /my/reservations — 본인 예약 목록 */
const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: res.locals.user.id })
    .populate("facility", "name")
    .sort({ date: -1, startTime: 1 });

  res.render("my-reservations", {
    layout: "layouts/main",
    title: "내 예약 — 하루예약",
    reservations,
    active: "my",
  });
});

/** DELETE /reservations/:id — 본인 예약 취소 (pending/approved 만) */
const cancelReservation = asyncHandler(async (req, res) => {
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
});

module.exports = { createReservation, getMyReservations, cancelReservation };
