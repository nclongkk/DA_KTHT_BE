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
    console.log(req.body);
    let group = await Group.aggregate([
      { $unwind: "$members" },
      {
        $match: {
          "members.member": ObjectId(userId),
          _id: ObjectId(groupId),
          "members.workDays.dayOfWeek": dayOfWeek,
        },
      },
      { $unwind: "$members.workDays" },
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
    let timeLate;
    if (checkinHour - timeStart <= 0) {
      timeLate = 0;
    }
    if (timeStart < checkinHour < timeFinish) {
      timeLate = checkinHour - timeStart;
    }
    if (checkinHour > timeFinish) {
      timeLate = timeFinish - timeStart;
    }
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
