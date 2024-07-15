const express = require("express");
const router = express.Router();
const BlogCategory = require("../models/BlogCategory");
const { body, validationResult } = require("express-validator");

// Read all categories
router.get("/blog-categories", async (req, res) => {
  try {
    const categories = await BlogCategory.find().sort({ name: 1 });
    res.render("pages/admin/blog_categories", { title:"Blog Categories",categories });
  } catch (err) {
    console.log(err);
    res.redirect("/admin");
  }
});

// Create a new category
router.get("/create-blog-category", (req, res) => {
  res.render("admin/createCategory", { errors: [] });
});

router.post(
  "/create-blog-category",
  [body("name").notEmpty().withMessage("Category name is required").trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("admin/createCategory", { errors: errors.array() });
    }

    try {
      const { name } = req.body;

      const category = new BlogCategory({ name });
      await category.save();

      res.redirect("/admin/categories");
    } catch (err) {
      console.log(err);
      res.render("admin/createCategory", { errors: [{ msg: err.message }] });
    }
  }
);

// Edit a category
router.get("/edit-blog-category/:id", async (req, res) => {
  try {
    const category = await BlogCategory.findById(req.params.id);
    res.render("admin/editCategory", { category, errors: [] });
  } catch (err) {
    console.log(err);
    res.redirect("/admin/categories");
  }
});

router.post(
  "/edit-blog-category/:id",
  [body("name").notEmpty().withMessage("Category name is required").trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const category = { _id: req.params.id, ...req.body };
      return res.render("admin/editCategory", {
        category,
        errors: errors.array(),
      });
    }

    try {
      const { name } = req.body;

      await BlogCategory.findByIdAndUpdate(req.params.id, { name });
      res.redirect("/admin/categories");
    } catch (err) {
      console.log(err);
      res.redirect("/admin/categories");
    }
  }
);

// Delete a category
router.post("/delete-blog-category/:id", async (req, res) => {
  try {
    await BlogCategory.findByIdAndDelete(req.params.id);
    res.redirect("/admin/categories");
  } catch (err) {
    console.log(err);
    res.redirect("/admin/categories");
  }
});

module.exports = router;
