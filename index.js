const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const User = require("./models/User");
const { body, validationResult } = require("express-validator");
const flash = require("connect-flash");
const passport = require("./config/passport");
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const upload = require('./config/multerconfig');  // Import the multer configuration


const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: false })); // To parse URL-encoded bodies

// Enable cookies
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: "my_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Initialize CSRF protection middleware
app.use(csrf({ cookie: true }));

// Initialize connect-flash middleware after session
app.use(flash());

app.use((req, res, next) => {
  // Middleware to make flash messages available in templates
  res.locals.messages = req.flash();
  // Middleware to make `req.user` available in all templates
  res.locals.user = req.user || null;
  next();
});

mongoose
  .connect("mongodb://127.0.0.1:27017/portfolio", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected successfully to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });

app.use(express.static(path.join(__dirname, "public")));
// Serve static files from the "node_modules" directory
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));

// middleware to protect routes
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

// Middleware to make CSRF token available in templates
app.use((req, res, next) => {
  const token = req.csrfToken();
  res.cookie("XSRF-TOKEN", token); // Store token in a cookie for client-side use if needed
  res.locals.csrfToken = token; // Make token available in templates
  next();
});

app.use("/", require("./routes/main"));
app.use("/", require("./routes/auth"));
app.use("/admin", ensureAuthenticated, require("./routes/admin"));
app.use("/admin", ensureAuthenticated, require("./routes/blogPost"));
app.use("/admin", ensureAuthenticated, require("./routes/blogCategory"));

// Catch-all route to handle 404 errors
app.use((req, res, next) => {
  res.status(404).render("pages/errors/404", {
    title: "Page Not Found",
    csrfToken: req.csrfToken(),
    user: req.user || null,
  });
});

// Handle 500 errors (If there is any error during request processing in any of the route handlers, the error-handling middleware will catch it.)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("pages/errors/500", {
    title: "Internal Server Error",
    csrfToken: req.csrfToken(),
    user: req.user || null,
  });
});

app.listen(port, () => {
  console.log(`Listening port on ${port}`);
});
