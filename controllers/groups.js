const { ObjectId } = require("mongodb");
const Group = require("../models/Group");
const TimeCheckin = require("../models/TimeCheckin");
const User = require("../models/User");
/**
 * @desc    GET all groups which this user has joined
 * @route   GET /api/v1/groups
 */
exports.getGroups = async (req, res) => {
  try {
    // //Pagination, default page 1, limit 5
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 3;
    const startIndex = (page - 1) * limit;

    let groups = await Group.aggregate([
      {
        $match: {
          $or: [
            { admin: ObjectId(req.user.id) },
            { "members.member": ObjectId(req.user.id) },
          ],
        },
      },
      { $skip: startIndex },
      { $limit: limit },
      {
        $project: {
          id: "$_id",
          _id: 0,
          name: "$name",
          description: "$description",
          numbersOfMember: { $size: "$members" },
          role: {
            $cond: [
              { $eq: ["$admin", ObjectId(req.user.id)] },
              "admin",
              "user",
            ],
          },
        },
      },
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const present = await Promise.all(
      groups.map((group) =>
        TimeCheckin.find({ group: ObjectId(group.id), day: today }).count()
      )
    );
    groups = groups.map((group, index) => ({
      ...group,
      absent: group.numbersOfMember - present[index],
    }));

    const totalGroups = await Group.find({
      $or: [
        { admin: ObjectId(req.user.id) },
        { "members.member": ObjectId(req.user.id) },
      ],
    }).count();
    const totalPage =
      Math.floor(totalGroups / limit) + (totalGroups % limit ? 1 : 0);

    res.status(200).json({ currentPage: page, totalPage, totalGroups, groups });
  } catch (error) {
    res.status(400).json(error);
  }
};

/**
 * @desc  Get specific group
 * @route GET /api/v1/groups/:id
 */
exports.getGroup = async (req, res) => {
  try {
    const group = await Group.find({ _id: ObjectId(req.params.id) })
      .select("-members.workDays")
      .populate({ path: "admin", select: "name avatar email" })
      .populate({
        path: "members.member",
        select: "name avatar",
      });
    res.status(200).json(group);
  } catch (error) {
    res.status(400).json(error);
  }
};

/**
 * @desc  Create new group
 * @route POST /api/v1/groups
 */
exports.createGroup = async (req, res) => {
  try {
    // Admin is the creator of this group
    const newGroup = { admin: req.user.id, ...req.body };
    await Group.create(newGroup);
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(400).json(error);
  }
};

/**
 * @desc  Update group
 * @route PATCH /api/v1/groups/:id
 */
exports.updateGroup = async (req, res) => {
  try {
    // const group = await Group.findById(req.params.id);
    const group = await Group.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json(group);
  } catch (error) {
    res.status(400).json(error);
  }
};

/**
 * @desc  Delete group
 * @route DELETE /api/v1/groups/:id
 * @access  Admin
 */
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (req.user.id !== group.admin.toString())
      return res
        .status(400)
        .json({ error: "Only admin have permission to access this route" });

    group.remove();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json(error);
  }
};

/**
 * @desc  Add new member to group
 * @route PUT /api/v1/groups/:id/member
 */
exports.addMember = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (
      await Group.findOne({
        "members.member": user._id,
        _id: ObjectId(req.params.id),
      })
    )
      return res
        .status(400)
        .json({ error: user.name + " has joined this group" });

    req.body = { ...req.body, member: user._id };
    const result = await Group.updateOne(
      { _id: ObjectId(req.params.id) },
      { $addToSet: { members: req.body } }
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json(error);
  }
};

/**
 * @desc  Delete member in group
 * @route DELETE /api/v1/groups/:id/member/:memberId
 */
exports.deleteMember = async (req, res) => {
  try {
    const result = await Group.updateOne(
      { _id: ObjectId(req.params.id) },
      { $pull: { members: { member: ObjectId(req.params.memberId) } } }
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json(error);
  }
};

/**
 * @desc  Update working day of member
 * @route PATCH /api/v1/groups/:id/member/:memberId
 */
exports.updateWorkDay = async (req, res) => {
  try {
    const result = await Group.updateOne(
      {
        _id: ObjectId(req.params.id),
        "members.member": ObjectId(req.params.memberId),
      },
      { $set: { "members.$.workDays": req.body } }
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json(error);
  }
};
