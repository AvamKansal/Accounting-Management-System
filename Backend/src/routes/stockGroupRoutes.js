import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import companyMiddleware from "../middleware/companyMiddleware.js";

import {
  createStockGroup,
  getStockGroups,
  getStockGroupById,
  updateStockGroup,
  deleteStockGroup,
} from "../controllers/stockGroupController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(companyMiddleware);

router.post("/", createStockGroup);

router.get("/", getStockGroups);

router.get("/:id", getStockGroupById);

router.put("/:id", updateStockGroup);

router.delete("/:id", deleteStockGroup);

export default router;