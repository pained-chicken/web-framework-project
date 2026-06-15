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

module.exports = mongoose.model("Reservation", reservationSchema);
