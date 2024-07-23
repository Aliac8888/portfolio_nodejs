const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

router.get("/user-management", async (req, res, next) => {
  try {
    const users = await User.find();
    res.render("pages/admin/users", {
      title: "User Management",
      users,
    });
  } catch (err) {
    console.log(err);
    throw err;
  }
});

router.post(
  "/update-user/:id",
  [
    body("level").notEmpty().withMessage("Level is required").trim(),
    body("username").notEmpty().withMessage("Username is required").trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error", errors.array());
      return res.redirect("/admin/user-management");
    }

    const {level,username} = req.body;
    try {
      await User.findByIdAndUpdate(req.params.id, {
        level: level,
        username: username,
      });
      req.flash("success", "User Updated Successfully");
      res.redirect("/admin/user-management");
    } catch (error) {
      console.log(error);
      req.flash("error", ["Unknown Error"]);
      res.redirect("/admin/user-management");
    }
  }
);

router.post("/delete-user/:id", async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.flash("success", "User Deleted Successfully");
    res.redirect("/admin/user-management");
  } catch (error) {
    console.log(error);
    req.flash("error", ["Unknown Error"]);
    res.redirect("/admin/user-management");
  }
});

module.exports = router;
