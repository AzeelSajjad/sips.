import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(process.cwd(), '../.env');
console.log("Looking for .env file at:", envPath);
const result = dotenv.config({ path: envPath });
console.log("Dotenv config result:", result);

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth";
import drinkRoutes from "./routes/drink";
import ratingRoutes from "./routes/rating";
import userRoutes from "./routes/user";
import mapRoutes from "./routes/map";
import { environment } from "./config/environment";

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("JWT_SECRET:", process.env.JWT_SECRET);

const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/drink", drinkRoutes);
app.use("/rating", ratingRoutes);
app.use("/user", userRoutes);
app.use("/map", mapRoutes);

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/sipsdb")
  .then(() => {
    console.log("✅ Connected to MongoDB");

    const port = process.env.PORT || 8081;
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });