import express from "express";
import cors from "cors";
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

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/stock-groups", stockGroupRoutes);
app.use("/api/stock-items", stockItemRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", salesRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SmartERP API Running",
  });
});

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

export default app;