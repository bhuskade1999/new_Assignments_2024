const User = require("../Models/User");
const cloudinary = require("cloudinary");
const DataUriParse = require("datauri/parser.js");
const path = require("path");
const crypto = require("crypto");
const { sendEmail } = require("../Middleware/sendEmail");
const {
  validateName,
  validateEmail,
  validatePassword,
} = require("../Validations/validations");

/* -----------------------------------  User Register  ------------------------------ */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, isActive } = req.body;
    file = req.file;

    const parser = new DataUriParse();
    const extName = path.extname(file.originalname).toString();
    const getUri = parser.format(extName, file.buffer);

    if (!validateName(name)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Name Format" });
    }

    if (!validateEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email Format" });
    }

    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email Format" });
    }

    let user = await User.findOne({ email: email });

    //checking email already exist or not
    if (user)
      return res
        .status(400)
        .json({ success: false, message: "User already Exists" });

    const myCloud = await cloudinary.v2.uploader.upload(getUri.content, {
      folder: "avatars",
    });

    user = await User.create({
      name,
      email,
      password,
      avatar: { public_id: myCloud.public_id, url: myCloud.secure_url },
      role,
      isActive,
    });

    //if user regsiter successfully then it will automatically logged in
    const token = await user.generateToken();
    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    res
      .status(201)
      .cookie("token", token, options)
      .json({ success: true, user, token });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

/* -----------------------------------  User Login  ------------------------------ */

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email }).select("+password");

    if (!user)
      return res
        .status(400)
        .json({ success: false, error: "User does not Exists" });

    const isMatch = await user.matchPassword(password);

    if (!isMatch)
      return res.status(400).json({ error: "Password is incorrect" });

    const token = await user.generateToken();

    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    res
      .status(200)
      .cookie("token", token, options)
      .json({ success: true, message: "User LoggedIn", user, token });
  } catch (err) {
    res.status(500).send({ success: false, error: err.message });
  }
};

/* -----------------------------------  User Logout  ------------------------------ */

exports.logout = async (req, res) => {
  try {
    res
      .status(200)
      .cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
      .json({ success: true, message: "Logged Out successfully" });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

/* -----------------------------------  User Update Profile  ------------------------------ */

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user._id);

    if (name) {
      if (!validateName(name)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid Name Format! ,No special character or number allowed",
        });
      }

      user.name = name;
    }

    if (email) {
      if (!validateEmail(email)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Email Format" });
      }
      user.email = email;
    }

    if (password) {
      console.log(password);
      if (!validatePassword(password)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid Password Format ? use atleast 1number,1 upperCase, 1 special character ",
        });
      }

      user.password = password;
    }

    await user.save();
    res
      .status(200)
      .json({ success: true, message: "profile updated successfully" });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

/* -----------------------------------  Activate Account  ------------------------------ */

exports.activateAccount = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    );
    res.json({ message: "User activated successfully", user: user });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

/* -----------------------------------  DeActivate Password  ------------------------------ */

exports.deActivateAccount = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );
    res.json({ message: "User DeActivated successfully", user: user });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

/* -----------------------------------  Forgot Password  ------------------------------ */

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const resetPasswordToken = user.getResetPasswordToken();

    await user.save();

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/user/account/password/reset/${resetPasswordToken}`;

    const message = `Reset Your Password by clicking on the link below: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Reset Password",
        message,
      });

      res.status(200).json({
        success: true,
        message: `Email sent to ${user.email}`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

/* -----------------------------------  reset Password  ------------------------------ */

exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid or has expired",
      });
    }

    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password Updated Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
