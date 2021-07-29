const path = require("path");
const fs = require("fs");
// const https = require("https");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const errorController = require("./controllers/error.js");
const User = require("./models/user.js");

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.9yqnp.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

// Passing env variables into Node Code
// We do that when we run our node application
// With nodemon.json file in project root folder

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: "sessions",
});
const csrfProtection = csrf();

// const privateKey = fs.readFileSync("server.key");
// const certificate = fs.readFileSync("server.cert");

// Storage engine which we can use with multer
const fileStorage = multer.diskStorage({
    // Functions which multer will execute for incoming file and these functions will control how this file is handled, regarding the place we stored it and regarding the naming
    destination: (req, file, cb) => {
        // If an error occured pass that err, else pass null
        // 2nd arg = destination
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        // If an error occured pass that err, else pass null
        // 2nd arg = filename we want to store
        cb(null, new Date().toDateString() + "-" + file.originalname);
    },
});

// Filtering which files to accept
const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin.js");
const shopRoutes = require("./routes/shop.js");
const authRoutes = require("./routes/auth.js");

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, "access.log"),
    { flags: "a" }
);

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                "script-src": ["'self'", "https://js.stripe.com/"],
                "frame-src": ["'self'", "https://js.stripe.com/"],
            },
        },
    })
);
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: false }));

// form, enctype = "application/x-www-form-urlencoded" is default which is urlencoded for text only
// bodyparser has no middleware for file uploads
// form, enctype = "multipart/form-data" to tell it will of mixed type, text as well as binaries
// single(), if we expect multiple or single files, "image" -> fieldName which we have to look for file
// it will store the content in req.file as Buffer in there
// dest: destination folder where to save the content, instead of buffer it will store there
app.use(multer({ storage: fileStorage, fileFilter }).single("image"));

app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
    session({
        secret: "my secret",
        resave: false,
        saveUninitialized: false,
        store,
    })
);
// Adding a middleware for protection
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then((user) => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch((err) => {
            next(new Error(err));
        });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);

app.use(errorController.get404);

// For Asynchronous errors, we need to call next(error) to reach error-handling middleware
// For Synchronous errors, only throwing error will lead us to this error handling middleware
// if we got multiple error handling middleware they will also execute from top to bottom
app.use((error, req, res, next) => {
    // Special error handling middleware with 4 arguments
    // res.status(error.httpStatusCode).render(...);    // if we want to set status code
    // res.redirect("/500");
    console.log(error);
    res.status(500).render("500", {
        pageTitle: "Some Error Occurred",
        path: "/500",
    });
});

mongoose
    .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => {
        app.listen(process.env.PORT || 3000, () => {
            console.log("Connected");
        });
        // https
        //     .createServer(
        //         {
        //             key: privateKey,
        //             cert: certificate,
        //         },
        //         app
        //     )
        //     .listen(process.env.PORT || 3000);
    })
    .catch((err) => {
        console.log(err);
    });
