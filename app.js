var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var methodOverride = require("method-override");
var flash = require("connect-flash");
var path = require("path");
require("dotenv").config();

var User = require("./models/users"),
    passport = require("passport"),
    localStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose");

var feedRoute = require("./routes/feed"),
    commentRoute = require("./routes/comments"),
    authRoute = require("./routes/index");


var app = express();

// For now, we will only connect to the database here.
// In other places, we will just refer to this connection.
var dburl = process.env.DATABASEURL;
mongoose.connect(dburl);

app.set("view engine", "ejs");
app.use(flash());


app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));
//app.use(express.static(path.join(__dirname, '/public')));

//CONFIGURE PASSPORT
app.use(require("express-session")({
    secret: "I love her more than anybody else in the world",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({extended: true}));

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

//USE THE ROUTES
app.use(feedRoute);
app.use(commentRoute);
app.use(authRoute);


app.listen(process.env.PORT, process.env.IP, function(){
    console.log("FoodiesHome server is running..");
});