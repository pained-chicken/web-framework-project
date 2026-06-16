const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Facility",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: String, // "YYYY-MM-DD"
    required: true,
  },
  startTime: {
    type: String, // "HH:MM" (24h, zero-padded)
    required: true,
  },
  endTime: {
    type: String, // "HH:MM"
    required: true,
  },
  purpose: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled"],
    default: "pending",
  },
  rejectReason: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * 시간대 충돌(overlap) 검사 — 같은 시설·날짜에서 겹치는 승인된 예약이 있으면 한 건 반환.
 * (정렬이 없어 어떤 건이 반환될지는 비결정적이며, 충돌 "존재 여부" 판단에만 사용한다.)
 * 승인된 예약만 자리를 점유한다. ignoreId로 자기 자신을 제외(승인 재검사 시).
 */
reservationSchema.statics.findConflict = function ({
  facility,
  date,
  startTime,
  endTime,
  ignoreId,
}) {
  const query = {
    facility,
    date,
    status: "approved",
    startTime: { $lt: endTime }, // 기존.시작 < 신규.종료
    endTime: { $gt: startTime }, // 기존.종료 > 신규.시작
  };
  if (ignoreId) query._id = { $ne: ignoreId };
  return this.findOne(query);
};

module.exports = mongoose.model("Reservation", reservationSchema);
