const express = require("express");
const router = express.Router();

const {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  addMember,
  deleteMember,
  updateWorkDay,
} = require("../controllers/groups");

const { protect } = require("../middleware/auth");

router.route("/").get(protect, getGroups).post(protect, createGroup);
router.route("/:id").patch(protect, updateGroup).delete(protect, deleteGroup);
router.route("/:id/member").put(protect, addMember);
router
  .route("/:id/member/:memberId")
  .patch(protect, updateWorkDay)
  .delete(protect, deleteMember);

module.exports = router;
