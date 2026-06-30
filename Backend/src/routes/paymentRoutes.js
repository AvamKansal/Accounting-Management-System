import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import companyMiddleware from "../middleware/companyMiddleware.js";

import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  companyMiddleware,
  createPayment
);

router.get(
  "/",
  authMiddleware,
  companyMiddleware,
  getPayments
);

router.get(
  "/:id",
  authMiddleware,
  companyMiddleware,
  getPaymentById
);

router.put(
  "/:id",
  authMiddleware,
  companyMiddleware,
  updatePayment
);

router.delete(
  "/:id",
  authMiddleware,
  companyMiddleware,
  deletePayment
);

export default router;