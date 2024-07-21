const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const username = req.params.username;
    const dir = path.join(
      __dirname,
      "..",
      "public",
      "uploads",
      "user_profiles",
      username
    );

    // Create the directory if it does not exist
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now()+"profile" + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
