import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import companyMiddleware from "../middleware/companyMiddleware.js";

import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";

const router = express.Router();

// Apply middleware to all routes
router.use(authMiddleware);
router.use(companyMiddleware);

router.post("/", createSupplier);
router.get("/", getSuppliers);
router.get("/:id", getSupplierById);

router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

export default router;