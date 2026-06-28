import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import companyMiddleware from "../middleware/companyMiddleware.js";

import {
  createPurchase,
  getPurchases,
  getPurchaseById,
} from "../controllers/purchaseController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(companyMiddleware);

// Create Purchase Voucher
router.post("/", createPurchase);

// Get All Purchase Vouchers
router.get("/", getPurchases);

// Get Purchase Voucher By ID
router.get("/:id", getPurchaseById);

export default router;