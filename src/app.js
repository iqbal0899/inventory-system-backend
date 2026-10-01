import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:4000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Inventory API is running",
  });
});

app.get("/api/v1/test", (req, res) => {
  res.json({
    success: true,
    message: "Frontend berhasil terhubung ke backend",
  });
});

export default app;