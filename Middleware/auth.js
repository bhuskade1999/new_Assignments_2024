const User = require("../Models/User");
const jwt = require("jsonwebtoken");

exports.isAuthenticated = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res
        .status(401)
        .json({ message: "You are not logged in! please login First" });
    }

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded._id);

    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Only admins allowed." });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
