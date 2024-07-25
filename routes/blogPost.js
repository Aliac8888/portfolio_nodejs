const express = require("express");
const router = express.Router();
const BlogPost = require("../models/BlogPost");
const BlogCategory = require("../models/BlogCategory");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");
const upload = require("../config/multerconfig"); // Import the multer configuration

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
      title: "Edit Blog Post",
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
    body("slug").notEmpty().withMessage("Slug is required").trim(),
    body("visible").notEmpty().withMessage("Visibility is required").trim(),
    body("description")
      .notEmpty()
      .withMessage("Description is required")
      .trim(),
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
      const { title, category, slug, visible, description } = req.body;
      // Reconstruct content array
      const contentArray = [];
      const contentTypes = Array.isArray(req.body["content[][type]"])
        ? req.body["content[][type]"]
        : [req.body["content[][type]"]];
      const contentData = Array.isArray(req.body["content[][data]"])
        ? req.body["content[][data]"]
        : [req.body["content[][data]"]];
      const contentPriorities = Array.isArray(req.body["content[][priority]"])
        ? req.body["content[][priority]"]
        : [req.body["content[][priority]"]];

      let imageIndex = 0;
      let contentIndex = 0;

      for (let i = 0; i < contentTypes.length; i++) {
        let data;
        if (contentTypes[i] === "image") {
          if (
            req.files["content[][data]"] &&
            req.files["content[][data]"][imageIndex]
          ) {
            data = `/uploads/blogs/${slug}/images/${req.files["content[][data]"][imageIndex].filename}`;
            imageIndex++;
          } else {
            throw new Error("Image file is missing for some content item");
          }
        } else {
          data = contentData[contentIndex];
          contentIndex++;
        }
        contentArray.push({
          type: contentTypes[i],
          data: data,
          priority: contentPriorities[i],
        });
      }

      const blogPost = new BlogPost({
        title: title,
        slug: slug,
        description: description,
        visible: visible,
        content: contentArray,
        templateImage: req.files.templateImage
          ? `/uploads/blogs/${slug}/images/template/${req.files.templateImage[0].filename}`
          : "",
        author: req.user._id,
        category: category,
      });

      await blogPost.save();
      req.flash("success", "Successfully Created the blog post");
      res.redirect("/admin/blogs");
    } catch (err) {
      console.log(err);
      const categories = await BlogCategory.find();
      res.render("pages/admin/create_blog_post", {
        messages: { error: [err.message] },
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
  upload.fields([
    { name: "templateImage", maxCount: 1 },
    { name: "content[][data]", maxCount: 10 }, // Adjust maxCount as needed
  ]),
  [
    body("title").notEmpty().withMessage("Title is required").trim(),
    body("slug").notEmpty().withMessage("Slug is required").trim(),
    body("visible").notEmpty().withMessage("Visibility is required").trim(),
    body("description")
      .notEmpty()
      .withMessage("Description is required")
      .trim(),
    body("category")
      .notEmpty()
      .withMessage("Category is required")
      .custom((value) => value !== "none")
      .withMessage("Please select a valid category"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error", errors.array());
      return res.redirect(`admin/edit-blog-post/${req.params.id}`);
    }

    try {
      const { title, category, slug, visible, description } = req.body;
      // Reconstruct content array
      const contentArray = [];
      const contentTypes = Array.isArray(req.body["content[][type]"])
        ? req.body["content[][type]"]
        : [req.body["content[][type]"]];
      const contentData = Array.isArray(req.body["content[][data]"])
        ? req.body["content[][data]"]
        : [req.body["content[][data]"]];
      const contentPriorities = Array.isArray(req.body["content[][priority]"])
        ? req.body["content[][priority]"]
        : [req.body["content[][priority]"]];

      let imageIndex = 0;
      let contentIndex = 0;

      for (let i = 0; i < contentTypes.length; i++) {
        let data;
        if (contentTypes[i] === "image") {
          if (
            req.files["content[][data]"] &&
            req.files["content[][data]"][imageIndex]
          ) {
            data = `/uploads/blogs/${slug}/images/${req.files["content[][data]"][imageIndex].filename}`;
            imageIndex++;
          } else {
            throw new Error("Image file is missing for some content item");
          }
        } else {
          data = contentData[contentIndex];
          contentIndex++;
        }
        contentArray.push({
          type: contentTypes[i],
          data: data,
          priority: contentPriorities[i],
        });
      }

      const blogPost = await BlogPost.findByIdAndUpdate(req.params.id, {
        title: title,
        slug: slug,
        description: description,
        visible: visible,
        content: contentArray,
        templateImage: req.files.templateImage
          ? `/uploads/blogs/${slug}/images/template/${req.files.templateImage[0].filename}`
          : "",
        author: req.user._id,
        category: category,
      });

      req.flash("success", "Successfully updated the blog post");
      res.redirect("/admin/blogs");
    } catch (err) {
      console.log(err);
      const categories = await BlogCategory.find();
      res.render("pages/admin/create_blog_post", {
        messages: { error: [err.message] },
        title: "Create Blog Post",
        categories,
        csrfToken: req.csrfToken(),
      });
    }
  }
);

// Delete a blog post
router.post("/delete-blog-post/:id", async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id);
    const blogDir = path.join(
      __dirname,
      "..",
      "public",
      "uploads",
      "blogs",
      blogPost.slug
    );
    if (fs.existsSync(blogDir)) {
      fs.rmSync(blogDir, { recursive: true, force: true });
    }
    await blogPost.deleteOne();

    req.flash("success", "Blog Post Deleted Successfully");
    res.redirect("/admin/blogs");
  } catch (err) {
    console.log(err);
    req.flash("error", ["Unknown Error"]);
    res.redirect("/admin/blogs");
  }
});

module.exports = router;
