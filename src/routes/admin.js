const express = require("express");
const router = express.Router();

const { checkAdmin } = require("../middleware/auth");
const admin = require("../controllers/adminController");

// 모든 관리자 라우트는 admin 권한 필요
router.use(checkAdmin);

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
