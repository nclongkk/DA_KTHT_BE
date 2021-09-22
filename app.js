const express = require("express");
const dotenv = require("dotenv");
const apiRouter = require("./routes/index");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");

const app = express();

//Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

//load env vars
dotenv.config({ path: "./config/config.env" });

// Connect to database
connectDB();

//Routes
app.use("/api/v1", apiRouter);

const PORT = process.env.PORT || 5000;
app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
