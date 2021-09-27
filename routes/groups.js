const express = require("express");
const router = express.Router({ mergeParams: true });

const { getGroups } = require("../controllers/groups");

const { protect } = require("../middleware/auth");

router.route("/").get(protect, getGroups);

module.exports = router;
