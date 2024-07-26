const express = require("express");
const BlogPost = require("../models/BlogPost");
const formatDate = require("../helpers/formatDate");
const router = express.Router();

router.get("/", (req, res, next) => {
  res.render("pages/index", {
    title: "aliac - Home",
  });
});

router.get("/blogs", async (req, res, next) => {
  const page = parseInt(req.query.page) || 1; // default to page 1 if not provided
  const limit = parseInt(req.query.limit) || 8; // default to 8 posts per page if not provided

  try {
    const blogPosts = await BlogPost.find({ visible: true })
      .populate("author category")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPosts = await BlogPost.countDocuments({ visible: true });
    const totalPages = Math.ceil(totalPosts / limit);

    res.render("pages/blogs", {
      title: "aliac - blog",
      blogPosts,
      currentPage: page,
      totalPages,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/blogs/:slug", async (req, res, next) => {
  try {
    const blogPost = await BlogPost.findOne({ slug: req.params.slug }).populate(
      "category author"
    );

    if (!blogPost) {
      const error = new Error("Blog post not found");
      error.status = 404;
      throw error;
    }

    // Sort the contents by priority in ascending order
    blogPost.content.sort((a, b) => a.priority - b.priority);

    const formattedCreatedAt = formatDate(blogPost.createdAt);
    const formattedUpdatedAt = formatDate(blogPost.updatedAt);

    const relatedBlogPosts = await BlogPost.find({
      visible: true,
      category: blogPost.category,
      _id: { $ne: blogPost._id },
    })
      .limit(4)
      .sort({ createdAt: -1 });


    res.render("pages/single_blog", {
      title: blogPost.title,
      blogPost,
      relatedBlogPosts,
      formattedCreatedAt,
      formattedUpdatedAt,
    });
  } catch (error) {
    next(error); // Passes the error to the error-handling middleware
  }
});

router.get("/resume", (req, res, next) => {
  res.render("pages/resume", {
    title: "aliac - Resume",
  });
});

module.exports = router;
