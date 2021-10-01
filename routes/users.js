const express = require("express");
const router = express.Router();

const { updateUser, personalSchedule } = require("../controllers/users");

const { protect } = require("../middleware/auth");

router.route("/").patch(protect, updateUser);
router.route("/schedule").get(protect, personalSchedule);

module.exports = router;
