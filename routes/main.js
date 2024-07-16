const express = require("express");
const BlogPost = require("../models/BlogPost");
const router = express.Router();

router.get("/", (req, res, next) => {
  res.render("pages/index", {
    title: "aliac - Home",
  });
});

router.get("/blogs", async (req, res, next) => {
  const blogPosts = await BlogPost.find({ visible: true })
    .populate("author category")
    .sort({ createdAt: -1 });
  res.render("pages/blogs", {
    title: "aliac - blog",
    blogPosts,
  });
});

router.get("/blogs/:slug", async (req, res, next) => {
  const blogPost = await BlogPost.findOne({ slug: req.params.slug });
  res.render("pages/single_blog", {
    title: "random blog",
    blogPost,
  });
});

router.get("/resume", (req, res, next) => {
  res.render("pages/resume", {
    title: "aliac - Resume",
  });
});

module.exports = router;
