import express from "express";
import authRoutes from "./routes/auth"; 
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

const app = express(); 

app.use(express.json());
app.use("/auth", authRoutes);

mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("✅ Connected to MongoDB");

    app.listen(8081, () => {
      console.log("🚀 Server running on http://localhost:8081");
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
