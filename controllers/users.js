const User = require("../models/User");

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
