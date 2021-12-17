const { ObjectId } = require("mongodb");
const Group = require("../models/Group");
const TimeCheckin = require("../models/TimeCheckin");
const User = require("../models/User");

/**
 * @desc  update timeCheckin
 * @route POST /api/v1/checkin
 */
exports.checkin = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const dayOfWeek = new Date().getDay();
    console.log(dayOfWeek);
    let group = await Group.aggregate([
      { $unwind: "$members" },
      { $unwind: "$members.workDays" },
      {
        $match: {
          "members.member": ObjectId(userId),
          _id: ObjectId(groupId),
          "members.workDays.dayOfWeek": dayOfWeek,
        },
      },
      { $sort: { "members.workDays.timeStart": 1 } },
      {
        $project: {
          _id: 1,
          name: "$name",
          description: "$description",
          timeStart: "$members.workDays.timeStart",
          timeFinish: "$members.workDays.timeFinish",
          dayOfWeek: "$members.workDays.dayOfWeek",
        },
      },
    ]);
    group = group[0];
    console.log(group);
    const { timeStart, timeFinish } = group;
    const checkinHour = new Date().getHours();
    const checkinMinute = new Date().getMinutes();
    if (checkinMinute < 10) {
      checkinMinute = "0" + checkinMinute;
    }
    const checkinTime = parseFloat(checkinHour + "." + checkinMinute);
    console.log(checkinTime);
    let timeLate;
    if (checkinTime - timeStart <= 0) {
      timeLate = 0;
    }
    if (timeStart < checkinTime < timeFinish) {
      timeLate = checkinTime - timeStart;
    }
    if (checkinTime > timeFinish) {
      timeLate = timeFinish - timeStart;
    }
    timeLate = timeLate.toFixed(2);
    const checkin = await TimeCheckin.create({
      group: groupId,
      user: userId,
      timeLate,
    });
    res.status(200).json(checkin);
  } catch (error) {
    res.status(400).json(error);
  }
};
