const express = require("express");
const {
  register,
  login,
  deActivateAccount,
  activateAccount,
  forgotPassword,
  resetPassword,
  updateProfile,
} = require("../Controller/user");
const { isAuthenticated, isAdmin } = require("../Middleware/auth");

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/updateprofile").post(isAuthenticated, updateProfile);
router
  .route("/account/activate/:userId")
  .post(isAuthenticated, isAdmin, activateAccount);
router
  .route("/account/deactivate/:userId")
  .post(isAuthenticated, isAdmin, deActivateAccount);

router.route("/account/password/forgot").post(forgotPassword);
router.route("/account/password/reset/:token").post(resetPassword);

module.exports = router;
