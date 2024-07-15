const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contentSchema = new Schema({
  type: {
    type: String,
    enum: ["text", "image"],
    required: true,
  },
  data: {
    type: String,
    required: true,
  },
  priority: {
    type: Number,
    required: true,
  },
});

const blogPostSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: [contentSchema],
    required: true,
  },
  templateImage: {
    type: String, // URL or path to the template image
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "BlogCategory",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to ensure unique priorities within content array
blogPostSchema.pre('save', function (next) {
  const content = this.content;
  const prioritySet = new Set(content.map(item => item.priority));
  if (prioritySet.size !== content.length) {
    const err = new Error('Content priorities must be unique');
    return next(err); // Pass the error to the next middleware
  }
  next(); // Proceed with the save operation if priorities are unique
});

const BlogPost = mongoose.model("BlogPost", blogPostSchema);
module.exports = BlogPost;
