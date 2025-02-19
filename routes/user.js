var express = require("express");
var router = express.Router();
var User = require("../models/users");
var passport = require("passport");
var middleware = require("../middleware");
var Postcontent = require("../models/index");
var userController = require("../controllers/user-controller");
var path = require("path"),
    crypto = require("crypto"),
    multer = require("multer"),
    GridFsStorage = require("multer-gridfs-storage"),
    Grid = require("gridfs-stream"),
    mongoose = require("mongoose");
var dburl = process.env.DATABASEURL;
const nodemailer = require("nodemailer");
// Get the mongo connection that we already have
const conn = mongoose.connection;
//for google APIs used for mail service
const { google } = require("googleapis");
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CLIENT_REDIRECT_URI
);
//We are signing in to gmail using oauth2 and not pure username & password
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_CLIENT_REFRESH_TOKEN });

//init gfs
let gfs;

conn.once("open", function () {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("uploads");
});

//middleware for file upload
var storage = new GridFsStorage({
    url: dburl,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });

//HOME ROUTE
router.get("/", function (req, res) {
    res.render("home");
});


//Registration page
router.get("/register", function (req, res) {
    res.render("authentication/register");
});


//User Registration
router.post("/register", upload.single("file"), userController.registerUser);


//Login routes
router.get("/login", function (req, res) {
    res.render("authentication/login");
});


router.post("/login", passport.authenticate("local",
    {
        successRedirect: "/index",
        failureRedirect: "/login",
        failureFlash: 'Invalid username or password.',
        successFlash: 'Welcome to FoodiesHome!'
    }), function (req, res) {
    });


//Logout route
router.get("/logout", function (req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash("success", "Successfully logged out");
        res.redirect("/");
    });
});


//For forgot password page
router.get("/forgot-password", (req, res) => {
    res.render("authentication/forgot-password");
});


//Forgot password route
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            req.flash("error", "No account with that email exists.");
            return res.redirect("/forgot-password");
        }

        // Generate reset token and expiry time
        const token = crypto.randomBytes(20).toString("hex");
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Get access token from refresh token
        const { token: accessToken } = await oauth2Client.getAccessToken();

        // Configure nodemailer transporter with OAuth2
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.EMAIL_USER, // Your Gmail email
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_CLIENT_REFRESH_TOKEN,
                accessToken: accessToken,
            },
        });

        console.log("Working till here");

        // Email options
        const resetURL = `http://${req.headers.host}/reset/${token}`;
        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER,
            subject: "Password Reset Request",
            text: `You (or someone else) requested a password reset for your account.\n\n
            Click the link below to reset your password:\n\n
            ${resetURL}\n\n
            If you did not request this, please ignore this email.`,
        };

        // Send email
        await transporter.sendMail(mailOptions);

        req.flash("success", "An email has been sent with password reset instructions.");
        res.redirect("/forgot-password");
    } catch (err) {
        console.error("Error in forgot-password route:", err);
        req.flash("error", "Something went wrong. Please try again.");
        res.redirect("/forgot-password");
    }
});


//Verify token to allow password reset
router.get("/reset/:token", async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            req.flash("error", "Password reset token is invalid or has expired.");
            return res.redirect("/forgot-password");
        }

        res.render("authentication/reset-password", { token: req.params.token });
    } catch (err) {
        console.error(err);
        res.redirect("/forgot-password");
    }
});


//Update the new password
router.post("/reset/:token", async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            req.flash("error", "Password reset token is invalid or has expired.");
            return res.redirect("/forgot-password");
        }

        // Set new password using passport-local-mongoose
        await user.setPassword(req.body.password);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        req.flash("success", "Password updated successfully! You can now log in.");
        res.redirect("/login");
    } catch (err) {
        console.error(err);
        res.redirect("/forgot-password");
    }
});


//ROUTE FOR DISPLAYING THE PROFILE PIC
router.get("/display/:filename", function (req, res) {
    gfs.files.findOne({ filename: req.params.filename }, function (err, foundFile) {
        if (err || !foundFile || foundFile.length === 0) {
            console.log(err);
            res.send("No such file exists");
        }
        else {
            if (foundFile.contentType === 'image/jpeg' || foundFile.contentType === 'image/png') {
                //res.render("display", {uploadedPicture: foundFile.filename});
                var readStream = gfs.createReadStream(foundFile.filename);
                readStream.pipe(res);
                //console.log(readStream);
                //res.redirect("/index");
                //   readStream.on('data', (chunk) => {
                //         res.render('display', { image: chunk.toString('base64') });
                //   });
            }
            else {
                res.send("Incompatible type of file");
            }
        }
    });
});


//GET ROUTER FOR MY ACCOUNT
router.get("/:id/account", middleware.isLoggedIn, function (req, res) {
    res.render("personal/account");
});


//Edit Profile Picture from Account page
router.put("/:id/updatePic", [middleware.isLoggedIn, upload.single("file")], function (req, res) {
    User.findByIdAndUpdate(req.params.id, { imageName: req.file.filename }, function (err, updatedUser) {
        if (err) {
            console.log(err);
        }
        else {
            //UPDATE CREATOR DATA IN POSTCONTENT
            var myquery = { "creator.id": req.params.id };
            var newValue = { $set: { "creator.profPic": req.file.filename } };
            Postcontent.updateMany(myquery, newValue, function (err, updatedPost) {
                if (err) {
                    console.log(err);
                }
            });

            res.redirect("/" + req.params.id + "/account");
        }
    });
});


//GET ROUTE FOR MY PROFILE
router.get("/:id/profile", middleware.isLoggedIn, function (req, res) {
    Postcontent.find({ "creator.id": req.user.id }).populate("comments").exec(function (err, foundPost) {
        if (err) {
            console.log(err);
        }
        else {
            res.render("personal/profile", { post: foundPost });
            //console.log(foundPost.comments);
        }
    });
});


//ROUTE TO SEE OTHERS DASHBOARD
router.get("/:id/othersProfile", middleware.isLoggedIn, function (req, res) {
    User.findById(req.params.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        }
        else {
            Postcontent.find({ "creator.id": req.params.id }).populate("comments").exec(function (err, foundPost) {
                if (err) {
                    console.log(err);
                }
                else {
                    res.render("personal/othersProfile", { user: foundUser, post: foundPost });
                }
            })

        }
    });
});


//GET ROUTE FOR ABOUT US
router.get("/about", middleware.isLoggedIn, function (req, res) {
    res.render("personal/about");
});

module.exports = router;