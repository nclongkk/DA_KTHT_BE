const { ObjectId } = require("mongodb");
const User = require("../models/User");
const Group = require("../models/Group");

/**
 * @desc    Modify information
 * @route   PATCH /api/v1/users
 */
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json(error);
  }
};

/**
 * @desc    Summary of each person's work schedule
 * @route   GET /api/v1/users/schedule
 */
exports.personalSchedule = async (req, res) => {
  try {
    const schedule = await Group.aggregate([
      { $unwind: "$members" },
      { $match: { "members.member": ObjectId(req.user.id) } },
      { $unwind: "$members.workDays" },
      { $sort: { "members.workDays.timeStart": 1 } },
      {
        $group: {
          _id: "$members.workDays.dayOfWeek",
          group: {
            $push: {
              name: "$name",
              description: "$description",
              feePerHour: "$feePerHour",
              timeStart: "$members.workDays.timeStart",
              timeFinish: "$members.workDays.timeFinish",
            },
          },
        },
      },
      { $addFields: { dayOfWeek: "$_id" } },
      { $project: { _id: 0 } },
      { $sort: { dayOfWeek: 1 } },
    ]);

    res.status(200).json(schedule);
  } catch (error) {
    res.status(400).json(error);
  }
};
