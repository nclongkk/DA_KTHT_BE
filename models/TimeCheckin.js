const mongoose = require("mongoose");
const getDate = () => {
  let day = new Date();
  day.setHours(0, 0, 0, 0);
  return day;
};

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
    default: getDate(),
  },
});

module.exports = mongoose.model("TimeCheckin", TimeCheckinSchema);
