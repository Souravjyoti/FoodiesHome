var User = require("../models/users");
const passport = require("passport");


const registerUser = (req, res) => {
    req.body.usernameOrEmail = req.body.email; //setting this field to match the authentication strategy
    if (!req.file || req.file.size > 1048576) {
        User.register(new User({ username: req.body.username, email: req.body.email, imageName: "8d0f0be7538dd1509d78136b1d2bbe0c.png" }), req.body.password, function (err, user) {
            if (err) {
                req.flash("error", err.message);
                res.redirect("/register");
            }
            else {
                passport.authenticate("local")(req, res, function () {
                    if (req.file && req.file.size > 1048576)
                        req.flash("error", "Profile pic size should be less than 1mb..!");
                    res.redirect("/index");
                });
            }
        });
    }
    else {
        User.register(new User({ username: req.body.username, email: req.body.email, imageName: req.file.filename }), req.body.password, function (err, user) {
            if (err) {
                req.flash("error", err.message);
                res.redirect("/register");
            }
            else {
                passport.authenticate("local")(req, res, function () {
                    req.flash("success", "Welcome to FoodiesHome " + user.username);
                    res.redirect("/index");
                });
            }
        });
    }
};

module.exports = { registerUser };