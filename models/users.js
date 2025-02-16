var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
   username: String,
   email: String,
   imageName: String,
   pictures: [],
   resetPasswordToken: String,
   resetPasswordExpires: Date
});

userSchema.plugin(passportLocalMongoose);

module.exports =  mongoose.model("User", userSchema);