const { ObjectId } = require("mongodb");
const Group = require("../models/Group");

/**
 * @desc    GET all groups which this user has joined
 * @route   GET /api/v1/groups
 */
exports.getGroups = async (req, res) => {
  let query;
  try {
    query = Group.find({
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
