const User = require("../models/User");
const bcrypt = require("bcryptjs");

/**
 * @desc     Register user
 * @route    POST /api/v1/auth/register
 * @access   Public
 */
exports.register = async (req, res) => {
  try {
    if (await User.findOne({ email: req.body.email })) {
      res.status(400).json({ msg: "existed" });
    } else {
      const { name, email, password } = req.body;

      // Create user
      const newUser = await User.create({
        name,
        email,
        password,
      });

      sendTokenResponse(newUser, 200, res);
    }
  } catch (error) {
    res.status(400).json(error);
  }
};

/**
 * @desc     Login user
 * @route    POST /api/v1/auth/login
 * @access   Public
 */
exports.login = async (req, res) => {
  User.findOne({ email: req.body.email })
    .select("+password")
    .then((user) => {
      if (!user) {
        res.status(401).json({ msg: "not-registered" });
      } else {
        // Match password
        bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            sendTokenResponse(user, 200, res);
          } else {
            res.status(400).json({ msg: "incorrect" });
          }
        });
      }
    });
};

/**
 * @desc  Get current logged in user
 * @route GET /api/v1/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json(error);
  }
};

/**
 * @desc     Log out clear cookie
 * @route    GET /api/v1/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    res.cookie("token", "none", {
      expires: new Date(Date.now() * 10 * 1000),
      httpOnly: true,
    });
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(400).json(error);
  }
};
// Get token from model create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create toke
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, token });
};
