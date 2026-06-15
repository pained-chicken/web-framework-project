const mongoose = require("mongoose");

const facilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["study", "meeting", "sports", "etc"],
    default: "etc",
  },
  description: {
    type: String,
    default: "",
  },
  capacity: {
    type: Number,
    default: 1,
  },
  openTime: {
    type: String, // "HH:MM"
    default: "09:00",
  },
  closeTime: {
    type: String, // "HH:MM"
    default: "22:00",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Facility", facilitySchema);
