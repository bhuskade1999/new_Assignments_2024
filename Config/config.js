const mongoose = require("mongoose");
const cloudinary = require("cloudinary");
require("dotenv").config({ path: "./Config/imp.env" });

exports.connectDatabase = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then((con) => console.log(`Database Connected `))
    .catch((error) => console.log(error));

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
  });
};
