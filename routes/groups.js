const express = require("express");
const router = express.Router();

const {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addMember,
  detailMember,
  deleteMember,
  updateWorkDay,
  sendReport,
} = require("../controllers/groups");

router.route("/").get(getGroups).post(createGroup);
router.route("/:id").get(getGroup).patch(updateGroup).delete(deleteGroup);
router.route("/:id/member").put(addMember);
router
  .route("/:id/member/:memberId")
  .get(detailMember)
  .patch(updateWorkDay)
  .delete(deleteMember);
router.route("/:id/sendEmail").post(sendReport);
module.exports = router;
