const { ObjectId } = require("mongodb");
const User = require("../models/User");
const Group = require("../models/Group");
const bcrypt = require("bcryptjs");

/**
 * @desc    Modify information
 * @route   PATCH /api/v1/users
 */
exports.updateUser = async (req, res) => {
  try {
    if (req.body.password) req.body.password = await encode(req.body.password);
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
        $project: {
          _id: 0,
          name: "$name",
          description: "$description",
          timeStart: "$members.workDays.timeStart",
          timeFinish: "$members.workDays.timeFinish",
          dayOfWeek: "$members.workDays.dayOfWeek",
        },
      },
    ]);

    res.status(200).json(schedule);
  } catch (error) {
    res.status(400).json(error);
  }
};

const encode = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};
