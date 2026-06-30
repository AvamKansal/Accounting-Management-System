import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import companyMiddleware from "../middleware/companyMiddleware.js";

import {
  createReceipt,
  getReceipts,
  getReceiptById,
  updateReceipt,
  deleteReceipt,
} from "../controllers/receiptController.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  companyMiddleware,
  createReceipt
);

router.get(
  "/",
  authMiddleware,
  companyMiddleware,
  getReceipts
);

router.get(
  "/:id",
  authMiddleware,
  companyMiddleware,
  getReceiptById
);

router.put(
  "/:id",
  authMiddleware,
  companyMiddleware,
  updateReceipt
);

router.delete(
  "/:id",
  authMiddleware,
  companyMiddleware,
  deleteReceipt
);

export default router;