
import express from "express";
import authRoutes from "./routes/auth"; 
import { Request, Response, NextFunction } from "express";


const app = express();
app.use(express.json());

app.use("/auth", authRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong.' });
});


app.listen(8081, () => {
  console.log("Server running on http://localhost:8081");
});
