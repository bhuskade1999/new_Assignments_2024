const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const { connectDatabase } = require("./Config/config.js");
const multer = require("multer");

const storage = multer.memoryStorage();
connectDatabase();

//using midleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(multer({ storage }).single("file"));

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: "./Config/imp.env" });
}

// importing routes

const user = require("./Routes/user.js");

//using routes

app.use("/api/user", user);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port : ${process.env.PORT}`);
});
