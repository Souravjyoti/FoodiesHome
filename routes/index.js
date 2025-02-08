var express = require("express");
var router = express.Router();
var User = require("../models/users");
var passport = require("passport");
var middleware = require("../middleware");
var Postcontent = require("../models/index");
var path = require("path"),
    crypto = require("crypto"),
    multer = require("multer"),
    GridFsStorage = require("multer-gridfs-storage"),
    Grid = require("gridfs-stream"),
    mongoose = require("mongoose");

var dburl = process.env.DATABASEURL;

// Get the mongo connection that we already have
const conn = mongoose.connection;

//init gfs
let gfs;

conn.once("open", function(){
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
router.get("/", function(req, res){
    res.render("home");
});

//==========================
//AUTH ROUTES
//==========================

//Register routes
router.get("/register", function(req,res){
    res.render("authentication/register");
});

//SIGNUP LOGIC
router.post("/register", upload.single("file"), function(req,res){
    if(!req.file || req.file.size>1048576){
        User.register(new User({username: req.body.username, imageName: "8d0f0be7538dd1509d78136b1d2bbe0c.png"}), req.body.password, function(err, user){
            if(err){
                req.flash("error", err.message);
                res.redirect("/register");
            }
            else{
                    passport.authenticate("local")(req, res, function(){
                    req.flash("error", "Profile pic size should be less than 1mb..!");
                    req.flash("success", "Welcome to FoodiesHome " + user.username);
                    res.redirect("/index");
                });
            }
        });
    }
    else{
        User.register(new User({username: req.body.username, imageName: req.file.filename}), req.body.password, function(err, user){
            if(err){
                req.flash("error", err.message);
                res.redirect("/register");
            }
            else{
                    passport.authenticate("local")(req, res, function(){
                    req.flash("success", "Welcome to FoodiesHome " + user.username);
                    res.redirect("/index");
                });
            }
        });

    }
});


//Login routes
router.get("/login", function(req, res){
    res.render("authentication/login");
});

router.post("/login", passport.authenticate("local" ,
    {
       successRedirect: "/index",
       failureRedirect: "/login",
       failureFlash: 'Invalid username or password.',
      successFlash: 'Welcome to FoodiesHome!'
    }), function(req, res){

});

//Logout route
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Successfully logged out");
    res.redirect("/");
});


//ROUTE FOR DISPLAYING THE PROFILE PIC
router.get("/display/:filename", function(req, res){
  gfs.files.findOne({filename: req.params.filename}, function(err, foundFile){
      if(err || !foundFile || foundFile.length === 0){
          console.log(err);
          res.send("No such file exists");
      }
      else{
          if(foundFile.contentType === 'image/jpeg' || foundFile.contentType === 'image/png'){
              //res.render("display", {uploadedPicture: foundFile.filename});
              var readStream = gfs.createReadStream(foundFile.filename);
              readStream.pipe(res);
              //console.log(readStream);
              //res.redirect("/index");
            //   readStream.on('data', (chunk) => {
            //         res.render('display', { image: chunk.toString('base64') });
            //   });
          }
          else{
              res.send("Incompatible type of file");
          }
      }
  });
});


//GET ROUTER FOR MY ACCOUNT
router.get("/:id/account", middleware.isLoggedIn, function(req, res){
   res.render("personal/account");
});


//Edit Profile Picture from Account page
router.put("/:id/updatePic", [middleware.isLoggedIn, upload.single("file")], function(req,res){
    User.findByIdAndUpdate(req.params.id, {imageName: req.file.filename}, function(err, updatedUser){
       if(err){
           console.log(err);
       }
       else{
           //UPDATE CREATOR DATA IN POSTCONTENT
           var myquery = { "creator.id": req.params.id };
           var newValue = {$set: {"creator.profPic": req.file.filename} };
           Postcontent.updateMany(myquery, newValue, function(err, updatedPost){
                if(err){
                    console.log(err);
                }
            });

           res.redirect("/" + req.params.id + "/account");
       }
    });
});

//GET ROUTE FOR MY PROFILE
router.get("/:id/profile", middleware.isLoggedIn, function(req, res){
   Postcontent.find({"creator.id": req.user.id}).populate("comments").exec(function(err, foundPost){
      if(err){
          console.log(err);
      }
      else{
          res.render("personal/profile", {post: foundPost});
          //console.log(foundPost.comments);
      }
   });
});


//ROUTE TO SEE OTHERS DASHBOARD
router.get("/:id/othersProfile", middleware.isLoggedIn, function(req, res){
    User.findById(req.params.id, function(err, foundUser){
       if(err){
           console.log(err);
       }
       else{
            Postcontent.find({"creator.id": req.params.id}).populate("comments").exec(function(err, foundPost){
                if(err){
                    console.log(err);
                }
                else{
                    res.render("personal/othersProfile", {user: foundUser, post: foundPost});
                }
            })

       }
    });
});


//GET ROUTE FOR ABOUT US
router.get("/about", middleware.isLoggedIn, function(req, res){
   res.render("personal/about");
});

module.exports = router;