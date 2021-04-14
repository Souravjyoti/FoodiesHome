var mongoose = require("mongoose");

var postSchema = new mongoose.Schema({
    imageName: String,
    caption: String,
    //comments: [],
    
    comments: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Comment"
        }
    ],
    
    creator: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        
        username: String,
        profPic: String
    }
});

module.exports = mongoose.model("Postcontent", postSchema);