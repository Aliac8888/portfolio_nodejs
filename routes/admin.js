const express = require("express");
const router = express.Router();
const BlogPost = require("../models/BlogPost");
const BlogCategory = require("../models/BlogCategory");
const { body, validationResult } = require("express-validator");
const upload = require("../config/multerconfig"); // Import the default multer configuration
const uploadUserProfile = require("../config/multerUserProfile"); // Import the multer configuration for storing user profile
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

router.get("/", async (req, res, next) => {
  try {
    const usersCount = await User.countDocuments();
    const blogPostsCount = await BlogPost.countDocuments();
    const blogCategoriesCount = await BlogCategory.countDocuments();
    res.render("pages/admin/dashboard", {
      title: "Dashboard",
      usersCount,
      blogPostsCount,
      blogCategoriesCount,
    });
  } catch (err) {
    console.log(err);
    throw err;
  }
});

router.get("/settings", async (req, res, next) => {
  try {
    res.render("pages/admin/settings", {
      title: "Settings",
    });
  } catch (err) {
    console.log(err);
    throw err;
  }
});

router.post(
  "/edit-user-preferences/:username",
  uploadUserProfile.single("profile"),
  [
    body("username")
      .optional({ checkFalsy: true })
      .trim()
      .custom(async (value, { req }) => {
        if (value && value !== req.params.username) {
          const existingUser = await User.findOne({ username: value }).exec();
          if (existingUser) {
            throw new Error("A user already exists with this username.");
          }
        }
        return true;
      }),
    // Custom validation to ensure at least one of username or profile is provided
    body().custom((value, { req }) => {
      if (!req.body.username && !req.file) {
        throw new Error("Either username or profile picture must be provided.");
      }
      return true;
    }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        req.flash("error", errors.array());
        return res.redirect("/admin/settings");
      }
      const { username } = req.body;
      const user = await User.findOne({ username: req.params.username });

      if (!user) {
        throw new Error("User not found.");
      }

      // Update the username if provided and different
      if (username && username !== user.username) {
        user.username = username;
      }

      // Update the profile picture if provided
      if (req.file) {
        const oldProfilePicPath = path.join(
          __dirname,
          "..",
          "public",
          user.profilePic
        );
        if (fs.existsSync(oldProfilePicPath)) {
          fs.unlinkSync(oldProfilePicPath); // Delete the old profile picture
        }
        user.profilePic = `/uploads/user_profiles/${user.username}/${req.file.filename}`;
      }

      await user.save();
      req.flash("success", "User Preferences Changed Successfully");
      return res.redirect("/admin/settings");
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/settings");
    }
  }
);

router.post(
  "/edit-user-password/:username",
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current Password Cant be empty")
      .trim()
      .isLength({ min: 8 })
      .custom((value, { req }) => req.user.comparePassword(value))
      .withMessage("wrong password for current password"),
    body("password")
      .notEmpty()
      .withMessage("New Password Cant be empty")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("confirm")
      .notEmpty()
      .withMessage("Confirm Password Cant be empty")
      .trim()
      .custom((value, { req }) => value === req.body.password)
      .withMessage("The passwords do not match"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error", errors.array());
      return res.redirect("/admin/settings");
    }
    try {
      const { password } = req.body;
      const user = await User.findOne({ username: req.params.username });
      user.password = password;
      await user.save();

      req.flash("success", "Password Changed Successfully");
      res.redirect("/admin/settings");
    } catch (error) {
      console.log(error);
      res.redirect("/admin/settings");
    }
  }
);

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

router.post("/delete-user/:id", async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/admin/user-management");
  } catch (error) {
    console.log(error);
    res.redirect("/admin/user-management");
  }
});

module.exports = router;
