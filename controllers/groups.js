const { ObjectId } = require("mongodb");
const Group = require("../models/Group");

/**
 * @desc    GET all groups which this user has joined
 * @route   GET /api/v1/groups
 */
exports.getGroups = async (req, res) => {
  let groups;
  try {
    groups = await Group.find({
      $or: [
        { admin: ObjectId(req.user.id) },
        { "members.member": ObjectId(req.user.id) },
      ],
    })
      .populate({ path: "admin", select: "name avatar email" })
      .populate({
        path: "members.member",
        select: "name avatar",
      });

    res.status(200).json(groups);
  } catch (error) {
    res.status(400).json(error);
  }
};
