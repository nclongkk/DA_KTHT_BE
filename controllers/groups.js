const { ObjectId } = require("mongodb");
const Group = require("../models/Group");

/**
 * @desc    GET all groups which this user has joined
 * @route   GET /api/v1/groups
 */
exports.getGroups = async (req, res) => {
  try {
    let query = Group.find({
      $or: [
        { admin: ObjectId(req.user.id) },
        { "members.member": ObjectId(req.user.id) },
      ],
    });

    //Select fields
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }

    //sort by group creation time
    query = query.sort("-createdAt");

    // //Pagination, default page 1, limit 5
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const startIndex = (page - 1) * limit;
    const totalGroups = await Group.find({
      $or: [
        { admin: ObjectId(req.user.id) },
        { "members.member": ObjectId(req.user.id) },
      ],
    }).count();
    const totalPage =
      Math.floor(totalGroups / limit) + (totalGroups % limit ? 1 : 0);

    query = query.skip(startIndex).limit(limit);

    //JOIN with User DB
    query = query
      .populate({ path: "admin", select: "name avatar email" })
      .populate({
        path: "members.member",
        select: "name avatar",
      });

    const groups = await query;

    res.status(200).json({ currentPage: page, totalPage, totalGroups, groups });
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
    req.body._id = req.body.member;
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
    await Group.updateOne(
      { _id: ObjectId(req.params.id) },
      { $pull: { members: { member: ObjectId(req.params.memberId) } } }
    );
    const result = await Group.updateOne(
      { _id: ObjectId(req.params.id) },
      {
        $addToSet: {
          members: { member: req.params.memberId, workDays: req.body },
        },
      }
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json(error);
  }
};
