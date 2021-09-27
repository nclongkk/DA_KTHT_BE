const express = require("express");
const app = express();

app.use("/auth", require("./auth"));
app.use("/groups", require("./groups"));

module.exports = app;
