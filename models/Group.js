const mongoose = require("mongoose");
const crypto = require("crypto");

const MemberSchema = mongoose.Schema({
  member: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  workDays: [Number],
});

const GroupSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: [true, "Please add name of group"],
    trim: true,
    maxlength: [50, "Name cannot be more than 50 characters"],
  },
  description: {
    type: String,
    required: false,
    maxlength: [500, "Description can not be more than 500 characters"],
  },
  address: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  secretCode: {
    type: String,
    default: crypto.randomBytes(20).toString("hex"),
  },
  workingTimePerDay: {
    type: Number,
    default: 8,
  },
  feePerHour: {
    type: Number,
    default: 20,
  },
  members: [MemberSchema],
});

module.exports = mongoose.model("Group", GroupSchema);
