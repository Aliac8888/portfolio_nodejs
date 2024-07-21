const express = require("express");
const router = express.Router();
const BlogCategory = require("../models/BlogCategory");
const { body, validationResult } = require("express-validator");
const BlogPost = require("../models/BlogPost");

// Read all categories
router.get("/blog-categories", async (req, res) => {
  try {
    const blogCategories = await BlogCategory.find().sort({ name: 1 });
    // Use Promise.all to wait for all usageCount promises to resolve
    const categoriesWithUsageCount = await Promise.all(
      blogCategories.map(async (category) => {
        const usageCount = await BlogPost.find({
          category: category._id,
        }).countDocuments();
        return {
          ...category.toObject(), // Convert Mongoose document to plain object
          usageCount,
        };
      })
    );
    res.render("pages/admin/blog_categories", {
      title: "Blog Categories",
      blogCategories: categoriesWithUsageCount,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/admin");
  }
});

router.post(
  "/create-blog-category",
  [body("name").notEmpty().withMessage("Category name is required").trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error", errors.array());
      return res.redirect("/admin/blog-categories");
    }

    try {
      const { name } = req.body;
      if (BlogCategory.findOne({name:name})) {
        req.flash("error", ["Blog Category With This Name Exists"]);
        return res.redirect("/admin/blog-categories");
      }

      const category = new BlogCategory({ name });
      await category.save();
      req.flash("success", ["Blog Category Created Successfully"]);
      res.redirect("/admin/blog-categories");
    } catch (err) {
      console.log(err);
      req.flash("error", ["Unknown Error"]);
      return res.redirect("/admin/blog-categories");
    }
  }
);

router.post(
  "/edit-blog-category/:id",
  [body("name").notEmpty().withMessage("Category name is required").trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error", errors.array());
      return res.redirect("/admin/blog-categories");
    }

    try {
      const { name } = req.body;

      await BlogCategory.findByIdAndUpdate(req.params.id, { name });
      req.flash("success", ["Blog Category Updated Successfully"]);
      return res.redirect("/admin/blog-categories");
    } catch (err) {
      console.log(err);
      req.flash("error", ["Unknown Error"]);
      return res.redirect("/admin/blog-categories");
    }
  }
);

// Delete a category
router.post("/delete-blog-category/:id", async (req, res) => {
  try {
    await BlogCategory.findByIdAndDelete(req.params.id);
    req.flash("success", ["Blog Category Deleted Successfully"]);
    return res.redirect("/admin/blog-categories");
  } catch (err) {
    console.log(err);
    req.flash("error", ["Unknown Error"]);
    return res.redirect("/admin/blog-categories");
  }
});

module.exports = router;
