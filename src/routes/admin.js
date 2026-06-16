const express = require("express");
const router = express.Router();

const { checkAdmin } = require("../middleware/auth");
const admin = require("../controllers/adminController");

// 모든 관리자 라우트(/admin*)는 admin 권한 필요.
// 경로를 한정하지 않으면 "/"에 마운트된 이 라우터가 미매칭 요청까지 가로채
// 404 핸들러 도달을 막으므로 "/admin" 으로 스코프를 제한한다.
router.use("/admin", checkAdmin);

/* 대시보드 */
router.get("/admin", admin.dashboard);

/* 시설 관리 */
router.get("/admin/facilities", admin.listFacilities);
router.get("/admin/facilities/new", admin.newFacilityForm);
router.post("/admin/facilities", admin.createFacility);
router.get("/admin/facilities/:id/edit", admin.editFacilityForm);
router.put("/admin/facilities/:id", admin.updateFacility);
router.delete("/admin/facilities/:id", admin.deleteFacility);

/* 예약 관리 */
router.get("/admin/reservations", admin.listReservations);
router.put("/admin/reservations/:id/approve", admin.approveReservation);
router.put("/admin/reservations/:id/reject", admin.rejectReservation);

module.exports = router;
