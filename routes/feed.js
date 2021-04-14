var express = require("express");
var router = express.Router();
var Postcontent = require("../models/index");
var User = require("../models/users");
var middleware = require("../middleware");
var path = require("path"),
    crypto = require("crypto"),
    multer = require("multer"),
    GridFsStorage = require("multer-gridfs-storage"),
    Grid = require("gridfs-stream"),
    mongoose = require("mongoose"),
    imageMagic = require("imagemagick");
    
    
var dburl = process.env.DATABASEURL || "mongodb://localhost/foodiesv5";
var conn = mongoose.createConnection(dburl);

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



//INDEX ROUTES
router.get("/index", middleware.isLoggedIn, function(req, res){
   Postcontent.find({}).populate("comments").exec(function(err, foundPost){
      if(err){
          console.log(err);
      } 
      else{
          res.render("indexPage/index", {post: foundPost});
          //console.log(foundPost.comments);
      }
   });
});

router.get("/index/new", middleware.isLoggedIn, function(req, res){
   res.render("indexPage/new"); 
});

//CHECK FILE SIZE
// function checkFileSize(filename, next){
//     if(filename.length<=1048576){
//         next();
//     }
// }

//NEW POST ROUTE
router.post("/index", [middleware.isLoggedIn, upload.single("file")], function(req, res){
    //console.log(req.file);
    if(req.file.size<=1048576){
        var uploadedImageName = req.file.filename;
        var creator = {
            id: req.user.id,
            username: req.user.username,
            profPic: req.user.imageName
        };
        
        Postcontent.create({
            imageName: uploadedImageName,
            caption: req.body.caption,
            creator: creator
        }, function(err, post){
            if(err){
                console.log(err);
            }
            else{
                //ADD IMAGE NAME TO USER DATA
                User.findOne({username : req.user.username}, function(err, foundUser){
                   if(err){
                       console.log(err);
                   } 
                   else{
                       foundUser.pictures.push(uploadedImageName);
                       foundUser.save();
                   }
                });
                req.flash("success", "New post added");
                res.redirect("/index");
            }
        });
    }
    else{
        req.flash("error", "Uploaded file should be less than 1mb..!");
        res.redirect("back");
    }
    
});



//SHOW ROUTE
router.get("/index/:id", middleware.isLoggedIn, function(req, res){
   Postcontent.findById(req.params.id).populate("comments").exec(function(err, foundPost){
      if(err){
          console.log(err);
      } 
      else{
          res.render("indexPage/show", {post: foundPost});
          //console.log(foundPost);
          //console.log(foundPost.comments);
      }
   });
});

//EDIT ROUTE
router.get("/index/:id/edit", middleware.checkPostOwnership, function(req, res){
    Postcontent.findById(req.params.id, function(err, foundPost){
        if(err){
            console.log(err);
        }
        else{
            res.render("indexPage/edit", {post: foundPost});
        }
    })
});

//UPDATE ROUTE
router.put("/index/:id", middleware.checkPostOwnership, function(req, res){
    Postcontent.findByIdAndUpdate(req.params.id, req.body.post, function(err, foundPost){
        if(err){
            console.log(err);
        }
        else{
            req.flash("success", "Post updated");
            res.redirect("/index");
        }
    });
});

//DELETE ROUTE
router.delete("/index/:id", middleware.checkPostOwnership, function(req,res){
    Postcontent.findByIdAndRemove(req.params.id, function(err, deletedCampground){
      if(err){
          res.redirect("/index/" +req.params.id);
      } 
      else{
          req.flash("success", "Post deleted");
          res.redirect("/index");
      }
   });
});


//ROUTE FOR DISPLAYING THE IMAGE FILE
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


module.exports = router;