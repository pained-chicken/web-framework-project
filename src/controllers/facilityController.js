const asyncHandler = require("express-async-handler");

const Facility = require("../models/Facility");
const Reservation = require("../models/Reservation");
const { CATEGORIES } = require("../utils/labels");
const { todayStr } = require("../utils/date");

const mainLayout = "layouts/main";

/** GET / , /home , /facilities — 활성 시설 목록 (검색 q + 카테고리 필터) */
const getFacilityList = asyncHandler(async (req, res) => {
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
});

/** 시설 상세를 렌더링하는 공용 헬퍼 (정상/에러 상황 공유 — reservationController에서도 사용) */
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
const getFacilityDetail = asyncHandler(async (req, res) => {
  const facility = await Facility.findById(req.params.id);
  if (!facility) return res.status(404).redirect("/");
  const date = req.query.date || todayStr();
  await renderFacilityDetail(req, res, { facility, date });
});

module.exports = { getFacilityList, getFacilityDetail, renderFacilityDetail };
