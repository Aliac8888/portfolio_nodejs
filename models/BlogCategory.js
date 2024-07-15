const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blogCategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const BlogCategory = mongoose.model("BlogCategory", blogCategorySchema);
module.exports = BlogCategory;
