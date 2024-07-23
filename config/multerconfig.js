const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "templateImage") {
      const destination = `public/uploads/blogs/${req.body.slug}/images/template/`;

      if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
      }
      cb(null, destination);
    }
    else if (file.fieldname === "content[][data]") {
      const dir = `public/uploads/blogs/${req.body.slug}/images/`;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    }
    else{
      cb(null, `public/uploads/`);
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
