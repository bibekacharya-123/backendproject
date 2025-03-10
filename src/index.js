import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/index.js";


dotenv.config({
    path: "./.env" // Ensure the correct path to your .env file
});

const app = express(); // Initialize express app

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running on port: ${process.env.PORT || 3000}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    });
