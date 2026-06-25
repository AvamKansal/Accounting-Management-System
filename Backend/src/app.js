import express from "express";
import cors from "cors";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";


const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

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