const mongoose = require('mongoose');

const uri = process.env.DB_URI
async function connectToDB(){
    try {
        console.log("Attempting connection..")
        await mongoose.connect(uri,{
            serverSelectionTimeoutMS:3000,
        })
        console.log("DB connected")
    } catch (error) {
        console.log("Failed to connect to DB:",error.message)
    }
}

module.exports = {connectToDB}