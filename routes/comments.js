var express = require("express");
var router = express.Router();
var Postcontent = require("../models/index");
var Comment = require("../models/comments");
var middleware = require("../middleware");

//COMMENT PUSH ROUTE
router.post("/index/:id/comment", middleware.isLoggedIn, function(req, res){
    Postcontent.findById(req.params.id, function(err, foundPost){
        if(err){
            req.flash("error", "Not found");
            res.redirect("/index");
        }
        else{
            Comment.create({text: req.body.comment}, function(err, createdComment){
                if(err){
                    console.log(err);
                }
                else{
                    createdComment.author.id = req.user.id;
                    createdComment.author.username = req.user.username;
                    createdComment.save();
                    foundPost.comments.push(createdComment);
                    foundPost.save();
                    req.flash("success", "You commented on this Post");
                    res.redirect("/index/"+req.params.id);
                }
            })
        }
    })
})

//EDIT ROUTE
router.get("/index/:id/comment/:comId/edit", middleware.checkCommentOwnership, function(req, res){
  Postcontent.findById(req.params.id, function(err, foundPost){
      if(err){
          res.redirect("back");
      }
      else{
          Comment.findById(req.params.comId, function(errNew, foundComment){
              if(err){
                  res.redirect("back");
              }
              else{
                  res.render("comments/edit", {comment: foundComment, post: foundPost});
              }
          })
      }
  }) 
});

// //UPDATE ROUTE
router.put("/index/:id/comment/:comId", middleware.checkCommentOwnership, function(req, res){
    Postcontent.findById(req.params.id, function(err, foundPost){
      if(err){
          res.redirect("back");
      } 
      else{
          Comment.findByIdAndUpdate(req.params.comId, {text: req.body.comment}, function(err, foundComment){
              if(err){
                  res.redirect("back");
              } 
              else{
                  req.flash("success", "Comment updated");
                  res.redirect("/index/" + req.params.id);
              }
          });
      }
    });
});

// //DELETE ROUTE
router.delete("/index/:id/comment/:comId", middleware.checkCommentOwnership, function(req, res){
  Comment.findByIdAndRemove(req.params.comId, function(err, deletedComment){
      if(err){
          res.redirect("back");
      } 
      else{
          //req.flash("success", "Comment deleted");
          req.flash("success", "Comment deleted");
          res.redirect("/index/" + req.params.id);
      }
  });
});


module.exports = router;