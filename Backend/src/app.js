import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import pool from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import unitRoutes from "./routes/unitRoutes.js";
import stockGroupRoutes from "./routes/stockGroupRoutes.js";
import stockItemRoutes from "./routes/stockItemRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import ledgerRoutes from "./routes/ledgerRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import receiptRoutes from "./routes/receiptRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

import errorMiddleware from "./middleware/errorMiddleware.js";

const app = express();

// ==========================================
// Middlewares
// ==========================================

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

// ==========================================
// API Routes
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/stock-groups", stockGroupRoutes);
app.use("/api/stock-items", stockItemRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/ledgers", ledgerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ==========================================
// Home Route
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SmartERP API Running",
  });
});

// ==========================================
// Health Check
// ==========================================

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "ERP Backend Running",
    timestamp: new Date(),
  });
});

// ==========================================
// Database Test
// ==========================================

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {

    console.error("DB ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code,
      detail: error.detail,
    });

  }
});

// ==========================================
// 404 Route
// ==========================================

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ==========================================
// Global Error Handler
// ==========================================

app.use(errorMiddleware);

export default app;