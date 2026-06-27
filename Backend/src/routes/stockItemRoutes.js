import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import companyMiddleware from "../middleware/companyMiddleware.js";

import {
  createStockItem,
  getStockItems,
  getStockItemById,
  updateStockItem,
  deleteStockItem,
} from "../controllers/stockItemController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(companyMiddleware);

router.post("/", createStockItem);

router.get("/", getStockItems);

router.get("/:id", getStockItemById);

router.put("/:id", updateStockItem);

router.delete("/:id", deleteStockItem);

export default router;