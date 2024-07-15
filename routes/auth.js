const express = require("express");
const { body, validationResult } = require("express-validator");
const passport = require("../config/passport");
const User = require("../models/User");

const router = express.Router();

router.get("/register", (req, res) => {
  res.render("auth/register", { errors: [] });
});

router.post(
  "/register",
  [
    body("username")
      .notEmpty()
      .withMessage("username cant be empty")
      .trim()
      .custom(async (value) => {
        const existingUser = await User.findOne({ username: value }).exec();
        if (existingUser) {
          throw new Error("A user already exists with this username.");
        }
      }),
    body("password")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("auth/register", { errors: errors.array() });
    }

    const { username, password } = req.body;
    try {
      const user = new User({ username, password });
      await user.save();
      res.redirect("/login");
    } catch (err) {
      console.log(err);
      res.redirect("/register", { errors: [{ msg: err.message }] });
    }
  }
);

router.get("/login", (req, res) => {
  res.render("auth/login");
});

router.post(
  "/login",
  [
    body("username")
      .notEmpty()
      .withMessage("Username can't be empty")
      .trim()
      .escape(), // Trim and escape to sanitize
    body("password")
      .notEmpty()
      .withMessage("Password can't be empty")
      .trim()
      .escape(), // Trim and escape to sanitize
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg);
      req.flash("error", errorMessages);
      req.flash("username", req.body.username);
      return res.redirect("/login");
    }
    next();
  },
  passport.authenticate("local", {
    successRedirect: "/admin",
    failureRedirect: "/login",
    failureFlash: true, // Enable flash messages
    failureMessage: true,
  }),
  function (req, res) {
    console.log(req);
    res.redirect("/login");
  }
);

router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
