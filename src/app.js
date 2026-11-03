import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import supplierRoutes from "./routes/supplier.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import stockRoutes from "./routes/stock.route.js";
import requestRoutes from "./routes/request.route.js";
import userRoutes from "./routes/user.route.js";
import purchaseRoutes from "./routes/purchase.route.js";
import rateLimitRoutes from "./routes/rate-limiter.route.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      "http://localhost:4000",
      "http://localhost:5000",
    ],
    credentials: true,
    exposedHeaders: [
      "Retry-After",
      "RateLimit",
      "RateLimit-Policy",
    ],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/reset-login", rateLimitRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/stock", stockRoutes);
app.use("/api/v1/requests", requestRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/purchases", purchaseRoutes);

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
