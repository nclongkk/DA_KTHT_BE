const mongoose = require("mongoose");

const TimeCheckinSchema = mongoose.Schema({
  group: {
    type: mongoose.Schema.ObjectId,
    ref: "Group",
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  timeLate: {
    type: Number,
  },
  day: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TimeCheckin", TimeCheckinSchema);
