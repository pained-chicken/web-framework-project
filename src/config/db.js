const mogoose = require("mongoose");
const asyncHandler = require("express-async-handler");
require("dotenv").config();

const connectDB = asyncHandler(async () => {
    const connect = await mogoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${connect.connection.host}`);
});

module.exports = connectDB;