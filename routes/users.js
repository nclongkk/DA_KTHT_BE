const express = require("express");
const router = express.Router();

const { updateUser } = require("../controllers/users");

const { protect } = require("../middleware/auth");

router.route("/").patch(protect, updateUser);

module.exports = router;
