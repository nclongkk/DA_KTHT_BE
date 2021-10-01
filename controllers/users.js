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
      {
        $group: {
          _id: "$members.workDays",
          group: {
            $push: {
              name: "$name",
              description: "$description",
              workingTimePerDay: "$workingTimePerDay",
              feePerHour: "$feePerHour",
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
