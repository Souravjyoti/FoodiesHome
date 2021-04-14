var Postcontent = require("../models/index");
var Comment = require("../models/comments");
var middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in first");
    res.redirect("/login");
};

//CHECK IMAGE SIZE
// middlewareObj.checkFileSize = function(req, res, next){
//     if(req.file.length<=1048576){
//         return next();
//     }
//     else{
//         req.flash("error", "File size should be less than 1mb..!!");
//     }
// };


//Authorization middleware for posts
middlewareObj.checkPostOwnership = function(req, res, next){
    //is he logged in?
    if(req.isAuthenticated()){
        //is he the creator of the campground?
        Postcontent.findById(req.params.id, function(err, foundPost){
           if(err){
               req.flash("error", "Post not found");
               res.redirect("back");
           } 
           else{
               //is the person logged in same as the creator
                if(foundPost.creator.id.equals(req.user._id)){
                    next(); 
                }
                else{
                    req.flash("error", "You do not have permission to do that");
                    res.redirect("back");
                }
            //console.log(req.user);
           }
        });
    }
    else{
        req.flash("error", "You need to be logged in first");
        res.redirect("/login");
    }
}

//Authorization middleware for comments
middlewareObj.checkCommentOwnership = function(req, res, next){
    //is he logged in?
    if(req.isAuthenticated()){
        //is he the creator of the campground?
        Comment.findById(req.params.comId, function(err, foundComment){
           if(err){
               req.flash("error", "Comment not found");
               res.redirect("back");
           } 
           else{
               //is the person logged in same as the creator
                if(foundComment.author.id.equals(req.user._id)){
                    next(); 
                }
                else{
                    req.flash("error", "You do not have permission to do that");
                    res.redirect("back");
                }
            //console.log(req.user);
           }
        });
    }
    else{
        req.flash("error", "You need to be logged in first");
        res.redirect("/login");
    }
}

module.exports = middlewareObj;