const express = require("express");
const router = express.Router();
const { checkin } = require("../controllers/checkin");

router.post("/", checkin);
module.exports = router;
