import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import companyMiddleware from "../middleware/companyMiddleware.js";

import {
  createSale,
  getSales,
  getSaleById,
} from "../controllers/salesController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(companyMiddleware);

// Create Sales Invoice
router.post("/", createSale);

// Get All Sales
router.get("/", getSales);

// Get Sale By ID
router.get("/:id", getSaleById);

export default router;