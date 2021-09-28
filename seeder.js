const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

//load env vars
dotenv.config({ path: "./config/config.env" });

//load models
const User = require("./models/User");
const Group = require("./models/Group");

//connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//read json file
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/users.json`, "utf-8")
);
const groups = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/groups.json`, "utf-8")
);

//import into db
const importData = async () => {
  try {
    await User.create(users);
    await Group.create(groups);

    console.log("Data Imported...");
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

//Delete data
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Group.deleteMany();

    console.log("Data Destroyed...");
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

if (process.argv[2] === "-i") {
  importData();
} else if (process.argv[2] === "-d") {
  deleteData();
}
