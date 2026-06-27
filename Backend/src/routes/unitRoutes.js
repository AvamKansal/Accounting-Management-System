import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import companyMiddleware from "../middleware/companyMiddleware.js";

import {
  createUnit,
  getUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
} from "../controllers/unitController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(companyMiddleware);

router.post("/", createUnit);

router.get("/", getUnits);

router.get("/:id", getUnitById);

router.put("/:id", updateUnit);

router.delete("/:id", deleteUnit);

export default router;