const express = require("express");
const app = express();

const { protect } = require("../middleware/auth");

app.use("/auth", require("./auth"));
app.use(protect);
app.use("/groups", require("./groups"));

module.exports = app;
