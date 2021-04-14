var Postcontent = require("./models/index");
var Comment = require("./models/comments");

var posts = [
    {
        name:"Najanu naam",
        image:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
        caption:"Ghorot bonaisu"
    },
    {
        name:"Najanu naam",
        image:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
        caption:"Ghorot bonaisu"
    },
    {
        name:"Najanu naam",
        image:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
        caption:"Ghorot bonaisu"
    }
];

function seedDB(){
    Postcontent.remove({}, function(err){
        // if(err){
        //     console.log(err);
        // }
        // else{
        //     console.log("Removed posts");
        //     for(var i=0;i<posts.length;i++){
        //         Postcontent.create(posts[i], function(err, createdPost){
        //           if(err){
        //               console.log(err);
        //           } else{
        //               console.log("Post added");
        //                     Comment.create({
        //                       text: "This place is really beautiful but doesn't have wifi..",
        //                       author: "Sourav"
        //                   }, function(err, comment){
        //                       if(err){
        //                           console.log(err);
        //                       }
        //                       else{
        //                           console.log("Comment is added");
        //                           createdPost.comments.push(comment);
        //                           createdPost.save();
        //                       }
        //                       console.log(createdPost);
        //                   });
        //           }
        //           //console.log(createdPost);
        //         });
        //     }
        // }
    });   
}

module.exports = seedDB;