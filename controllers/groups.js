const { ObjectId } = require("mongodb");
const moment = require("moment");
const Group = require("../models/Group");
const TimeCheckin = require("../models/TimeCheckin");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
/**
 * @desc    GET all groups which this user has joined
 * @route   GET /api/v1/groups
 */
exports.getGroups = async (req, res) => {
  try {
    // //Pagination, default page 1, limit 5

    let groups = await Group.aggregate([
      {
        $match: {
          $or: [
            { admin: ObjectId(req.user.id) },
            { "members.member": ObjectId(req.user.id) },
          ],
        },
      },
      {
        $project: {
          id: "$_id",
          _id: 0,
          members: 1,
          name: "$name",
          groupImage: "$groupImage",
          description: "$description",
          numbersOfMember: { $size: "$members" },
          role: {
            $cond: [
              { $eq: ["$admin", ObjectId(req.user.id)] },
              "admin",
              "user",
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "members.member",
          foreignField: "_id",
          as: "avatars",
        },
      },
    ]);
    //remove unnecessary property
    groups = groups.map(({ members, ...rest }) => ({
      ...rest,
    }));
    groups.forEach((group) => {
      group.avatars = group.avatars.map(({ avatar, name }) => ({
        avatar,
        name,
      }));
    });

    let day = new Date();
    day.setHours(0, 0, 0, 0);
    const time = await TimeCheckin.find({
      group: ObjectId("6150b5c637cef39b11366cc8"),
      day,
    });
    const present = await Promise.all(
      groups.map((group) =>
        TimeCheckin.find({ group: ObjectId(group.id), day }).count()
      )
    );
    groups = groups.map((group, index) => ({
      ...group,
      checkedIn: present[index],
    }));

    res.status(200).json({ groups });
  } catch (error) {
    console.log(error);
    res.status(400).json(error);
  }
};

/**
 * @desc  Get specific group
 * @route GET /api/v1/groups/:id
 */
exports.getGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    let group = await Group.findOne({ _id: groupId })
      .populate({ path: "admin", select: "name avatar email" })
      .populate({
        path: "members.member",
        select: "name avatar email",
      })
      .lean();

    group.members = group.members.map((member) => {
      let checkScheduleToday = false;
      member.workDays.forEach((workDay) => {
        if (workDay.dayOfWeek === new Date().getDay()) {
          checkScheduleToday = true;
        }
      });
      return { ...member, hasScheduleToday: checkScheduleToday };
    });

    let day = new Date();
    day.setHours(0, 0, 0, 0);
    let listMembersCheckedIn = await TimeCheckin.find({
      group: groupId,
      day,
    }).select("user");
    listMembersCheckedIn = listMembersCheckedIn.map((member) =>
      String(member.user)
    );

    group.members = group.members.map((member) => {
      if (listMembersCheckedIn.includes(String(member.member._id))) {
        return { ...member, workDays: undefined, checkedIn: true };
      } else {
        return { ...member, workDays: undefined, checkedIn: false };
      }
    });
    res.status(200).json(group);
  } catch (error) {
    console.log(error);
    res.status(400).json(error);
  }
};

/**
 * @desc  Create new group
 * @route POST /api/v1/groups
 */
exports.createGroup = async (req, res) => {
  try {
    // Admin is the creator of this group
    const newGroup = { admin: req.user.id, ...req.body };
    await Group.create(newGroup);
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(400).json(error);
  }
};

/**
 * @desc  Update group
 * @route PATCH /api/v1/groups/:id
 */
exports.updateGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json(group);
  } catch (error) {
    res.status(400).json(error);
  }
};

/**
 * @desc  Delete group
 * @route DELETE /api/v1/groups/:id
 * @access  Admin
 */
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (req.user.id !== group.admin.toString())
      return res
        .status(400)
        .json({ error: "Only admin have permission to access this route" });

    group.remove();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json(error);
  }
};

/**
 * @desc  Add new member to group
 * @route PUT /api/v1/groups/:id/member
 */
exports.addMember = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (
      await Group.findOne({
        "members.member": user._id,
        _id: ObjectId(req.params.id),
      })
    )
      return res
        .status(400)
        .json({ error: user.name + " has joined this group" });

    req.body = { ...req.body, member: user._id };
    const result = await Group.updateOne(
      { _id: ObjectId(req.params.id) },
      { $addToSet: { members: req.body } }
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json(error);
  }
};

/**
 * @desc  Detail working history of member
 * @route GET /api/v1/groups/:id/member/:memberId
 */
exports.detailMember = async (req, res) => {
  try {
    const groupId = req.params.id;
    const memberId = req.params.memberId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() + 1);
    const monday = getMonday(today);
    const listCheckedInInWeek = await TimeCheckin.find({
      group: groupId,
      user: memberId,
      day: { $gte: monday, $lte: today },
    });
    let workingDay = await Group.aggregate([
      { $match: { _id: ObjectId(groupId) } },
      { $unwind: "$members" },
      { $match: { "members.member": ObjectId(memberId) } },
      { $unwind: "$members.workDays" },
      {
        $project: {
          members: 1,
        },
      },
    ]);
    workingDay = workingDay.map((element) => element.members.workDays);

    let scheduleToday = null;
    workingDay = workingDay.map((day) => {
      let tmp = { ...day, checkedIn: false };
      listCheckedInInWeek.forEach((checkedIn) => {
        if (checkedIn.day.getDay() === day.dayOfWeek) {
          tmp = { ...day, checkedIn: true, timeLate: checkedIn.timeLate };
        }
      });
      if (tmp.dayOfWeek == new Date().getDay()) {
        scheduleToday = tmp;
      }
      return tmp;
    });

    res.status(200).json({ workingDay, today: scheduleToday });
  } catch (error) {
    res.status(400).json(error);
  }
};

/**
 * @desc  Delete member in group
 * @route DELETE /api/v1/groups/:id/member/:memberId
 */
exports.deleteMember = async (req, res) => {
  try {
    const result = await Group.updateOne(
      { _id: ObjectId(req.params.id) },
      { $pull: { members: { member: ObjectId(req.params.memberId) } } }
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json(error);
  }
};

/**
 * @desc  Update working day of member
 * @route PATCH /api/v1/groups/:id/member/:memberId
 */
exports.updateWorkDay = async (req, res) => {
  try {
    const result = await Group.updateOne(
      {
        _id: ObjectId(req.params.id),
        "members.member": ObjectId(req.params.memberId),
      },
      { $set: { "members.$.workDays": req.body } }
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json(error);
  }
};

/**
 * @desc  Send report of members in group to  email of creator
 * @route POST /api/v1/groups/:id/sendEmail
 */
exports.sendReport = async (req, res) => {
  try {
    const groupId = req.params.id;
    const group = await Group.findById(groupId).populate({
      path: "admin",
      select: "email",
    });
    let firstDay = new Date();
    // firstDay.setDate(1);
    firstDay.setMonth(firstDay.getMonth() - 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() + 1);
    let listCheckedIn = await TimeCheckin.aggregate([
      { $match: { group: ObjectId(groupId) } },
      { $match: { day: { $gte: firstDay, $lte: today } } },
      {
        $group: {
          _id: "$user",
          checkedIn: { $push: { timeLate: "$timeLate", day: "$day" } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "info",
        },
      },
    ]);

    let htmlString = `<h1>Statistical list of attendance time of members in group ${
      group.name
    }</h1> <h2>From ${formatDay(firstDay)} to ${formatDay(today)}</h2>`;

    // console.log(listCheckedIn[0].info[0].name);
    for (let i = 0; i < listCheckedIn.length; i++) {
      let userId = String(listCheckedIn[i]._id);
      let mulct = 0;
      htmlString += `<h3>${listCheckedIn[i].info[0].name}</h3>`;
      htmlString += `<ul>`;
      listCheckedIn[i].checkedIn.forEach((checkIn) => {
        latedMinutes =
          checkIn.timeLate == 0
            ? 0
            : parseInt(String(checkIn.timeLate).split(".")[0]) * 60 +
              parseInt(String(checkIn.timeLate).split(".")[1]);
        htmlString += `<li>Day ${formatDay(
          checkIn.day
        )}, time late: ${latedMinutes} minutes </li>`;
      });
      htmlString += `</ul>`;
      let memberIdex = group.members.findIndex(
        (member) => String(member.member) == userId
      );
      let workingDayOfMember = numberWorkingDay(
        firstDay,
        today,
        group.members[memberIdex].workDays
      );

      htmlString += `<p>And ${Math.abs(
        workingDayOfMember - listCheckedIn[i].checkedIn.length
      )} days left of no attendance or forgot to take attendance </p>`;

      // htmlString+=
      let daytmp = moment().startOf("month").toDate();
      while (daytmp < today) {
        const member = group.members[memberIdex];
        // console.log(member);

        let indexCheckedIn = listCheckedIn[i].checkedIn.findIndex(
          (checkIn) => checkIn.day.toISOString() === daytmp.toISOString()
        );
        if (indexCheckedIn > -1) {
          mulct +=
            (listCheckedIn[i].checkedIn[indexCheckedIn].timeLate / 0.6) *
            group.feePerHour;
        } else {
          indexWorkingDay = member.workDays.findIndex(
            (day) => day.dayOfWeek == daytmp.getDay()
          );
          if (indexWorkingDay > -1) {
            mulct +=
              (member.workDays[indexWorkingDay].timeFinish -
                member.workDays[indexWorkingDay].timeStart) *
              group.feePerHour;
          }
        }
        daytmp.setDate(daytmp.getDate() + 1);
      }
      htmlString += `<h4> Total fines : ${mulct} VND</h4>`;
    }
    await sendEmail({
      email: group.admin.email,
      subject: `Report from DAKTHT of group ${group.name}`,
      message: htmlString,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(400).json(error);
  }
};

const getMonday = (d) => {
  d = new Date(d);
  var day = d.getDay(),
    diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

const numberWorkingDay = (startDate, endDate, listWorkingDays) => {
  // total days between these day
  let DaysBetween =
    (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
  DaysBetween = DaysBetween - endDate.getDay() - (6 - startDate.getDay() + 1);

  let count = 0;
  for (let day of listWorkingDays) {
    day.dayOfWeek >= startDate.getDay() && count++;
    day.dayOfWeek <= endDate.getDay() && count++;
  }
  return count + Math.floor(DaysBetween / 7) * listWorkingDays.length;
};

const formatDay = (day) => {
  let dd = String(day.getDate()).padStart(2, "0");
  let mm = String(day.getMonth() + 1).padStart(2, "0"); //January is 0!
  let yyyy = day.getFullYear();

  str = mm + "/" + dd + "/" + yyyy;
  return str;
};
