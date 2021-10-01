const express = require("express");
const router = express.Router();

const { updateUser, personalSchedule } = require("../controllers/users");

router.route("/").patch(updateUser);
router.route("/schedule").get(personalSchedule);

module.exports = router;
