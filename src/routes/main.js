const express = require("express");
const router = express.Router();

const { checkLogin } = require("../middleware/auth");
const auth = require("../controllers/authController");
const facility = require("../controllers/facilityController");
const reservation = require("../controllers/reservationController");

/* 공개 / 유저 */
router.get(["/", "/home", "/facilities"], facility.getFacilityList);
router.get("/facilities/:id", facility.getFacilityDetail);
router.post("/reservations", checkLogin, reservation.createReservation);
router.get("/my/reservations", checkLogin, reservation.getMyReservations);
router.delete("/reservations/:id", checkLogin, reservation.cancelReservation);

/* 인증 */
router.get("/login", auth.getLogin);
router.post("/login", auth.postLogin);
router.get("/register", auth.getRegister);
router.post("/register", auth.postRegister);
router.post("/logout", auth.logout);

module.exports = router;
