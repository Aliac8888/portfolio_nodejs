const express = require("express");
const router = express.Router();
const BlogPost = require("../models/BlogPost");
const BlogCategory = require("../models/BlogCategory");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const User = require("../models/User");

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
