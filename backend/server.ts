
import express from "express";
import authRoutes from "./routes/auth"; 

const app = express();
app.use(express.json());

app.use("/auth", authRoutes);

app.listen(8081, () => {
  console.log("Server running on http://localhost:8081");
});
