const express = require("express");
const router = express.Router();
const BlogPost = require("../models/BlogPost");
const BlogCategory = require("../models/BlogCategory");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const upload = require('../config/multerconfig');  // Import the multer configuration



// Read all blog posts
router.get("/blogs", async (req, res) => {
  try {
    const blogPosts = await BlogPost.find()
      .populate("author category")
      .sort({ createdAt: -1 });
    res.render("pages/admin/blogs", {
      blogPosts,
      title: "Blogs",
      csrfToken: req.csrfToken(),
    });
  } catch (err) {
    console.log(err);
    res.redirect("/admin");
  }
});

// Create a new blog post page
router.get("/create-blog-post", async (req, res) => {
  const categories = await BlogCategory.find();
  const csrfToken = req.csrfToken();
  console.log("CSRF Token for create-blog-post (server):", csrfToken); // Debugging
  res.render("pages/admin/create_blog_post", {
    errors: [],
    title: "Create Blog Post",
    categories,
  });
});

// Edit a blog post page
router.get("/edit-blog-post/:id", async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id);
    const categories = await BlogCategory.find();
    res.render("pages/admin/edit_blog_post", {
      blogPost,
      categories,
      errors: [],
    });
  } catch (err) {
    console.log(err);
    res.redirect("/admin/blogs");
  }
});

// Create a new blog post in db
router.post(
  "/create-blog-post",
  upload.fields([
    { name: "templateImage", maxCount: 1 },
    { name: "content[][data]", maxCount: 10 }, // Adjust maxCount as needed
  ]),
  [
    body("title").notEmpty().withMessage("Title is required").trim(),
    body("category")
      .notEmpty()
      .withMessage("Category is required")
      .custom((value) => value !== "none")
      .withMessage("Please select a valid category"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const categories = await BlogCategory.find();
      return res.render("pages/admin/create_blog_post", {
        errors: errors.array(),
        title: "Create Blog Post",
        categories: categories,
        csrfToken: req.csrfToken(),
      });
    }

    try {
      const { title, category } = req.body;
      // This should be an array of content items
      const contentArray = req.body.content.map((item, index) => ({
        type: item.type,
        data:
          item.type === "image"
            ? req.files["content[][data]"][index].path
            : item.data,
        priority: item.priority,
      }));

      const blogPost = new BlogPost({
        title: title,
        content: contentArray,
        templateImage: req.files.templateImage
          ? `/uploads/${req.files.templateImage[0].filename}`
          : "",
        author: req.user._id,
        category: category,
      });

      await blogPost.save();
      res.redirect("/admin/blogs");
    } catch (err) {
      console.log(err);
      const categories = await BlogCategory.find();
      res.render("pages/admin/create_blog_post", {
        errors: [err.message],
        title: "Create Blog Post",
        categories,
        csrfToken: req.csrfToken(),
      });
    }
  }
);

// edit a blog post in db
router.post(
  "/edit-blog-post/:id",
  upload.single("templateImage"),
  [
    body("title").notEmpty().withMessage("Title is required").trim(),
    body("content").notEmpty().withMessage("Content is required").trim(),
    body("category").notEmpty().withMessage("Category is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const blogPost = { _id: req.params.id, ...req.body };
      const categories = await BlogCategory.find();
      return res.render("pages/admin/edit_blog_post", {
        blogPost,
        categories,
        errors: errors.array(),
        title: "Edit Blog Post",
      });
    }

    try {
      const { title, content, category } = req.body;
      const contentArray = JSON.parse(content);

      const updateData = {
        title,
        content: contentArray,
        updatedAt: Date.now(),
        category,
      };

      if (req.file) {
        updateData.templateImage = `/uploads/${req.file.filename}`;
      }

      await BlogPost.findByIdAndUpdate(req.params.id, updateData);
      res.redirect("/admin/blogs");
    } catch (err) {
      console.log(err);
      res.redirect("/admin/blogs");
    }
  }
);

// Delete a blog post
router.post("/delete-blog-post/:id", async (req, res) => {
  try {
    await BlogPost.findByIdAndDelete(req.params.id);
    res.redirect("/admin/blogs");
  } catch (err) {
    console.log(err);
    res.redirect("/admin/blogs");
  }
});

module.exports = router;
