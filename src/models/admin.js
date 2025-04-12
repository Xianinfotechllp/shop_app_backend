const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
    name:{
        type:String
    },
    email:{
        type:String,
    },
    mobileNumber:{
        type:Number,
    },
    password:{
        type:String,
        required:true
    },
    role: {
        type: String,
        default: "admin",
        enum: ["admin"],
        immutable: true
    }
},{timestamps:true});

const adminModel = mongoose.model('admin',adminSchema);

module.exports = adminModel;