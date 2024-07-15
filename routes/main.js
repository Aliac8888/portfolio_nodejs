const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
  res.render("pages/index", {
    title: "aliac - Home",
  });
});

router.get("/blogs", (req, res, next) => {
  res.render("pages/blogs", {
    title: "aliac - blog",
  });
});

router.get("/single-blog", (req, res, next) => {
  res.render("pages/single_blog", {
    title: "random blog",
  });
});

router.get("/resume", (req, res, next) => {
  res.render("pages/resume", {
    title: "aliac - Resume",
  });
});

module.exports = router;
