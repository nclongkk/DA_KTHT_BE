const express = require("express");
const router = express.Router();

const {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addMember,
  deleteMember,
  updateWorkDay
} = require("../controllers/groups");

router.route("/").get(getGroups).post(createGroup);
router.route("/:id").get(getGroup).patch(updateGroup).delete(deleteGroup);
router.route("/:id/member").put(addMember);
router.route("/:id/member/:memberId").patch(updateWorkDay).delete(deleteMember);

module.exports = router;
