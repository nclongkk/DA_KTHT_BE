const User = require("../models/User");
const bcrypt = require("bcryptjs");

/**
 * @desc     Register user
 * @route    POST /api/v1/auth/register
 * @access   Public
 */
exports.register = async (req, res) => {
  try {
    User.findOne({ email: req.body.email }).then((user) => {
      if (user) {
        res.status(400).json({ msg: "existed" });
      } else {
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          role: req.body.role,
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser.save();
          });
        });

        sendTokenResponse(newUser, 200, res);
      }
    });
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
