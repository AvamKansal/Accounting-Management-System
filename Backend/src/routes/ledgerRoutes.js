import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import companyMiddleware from "../middleware/companyMiddleware.js";

import {
  createLedger,
  getLedgers,
  getLedgerById,
} from "../controllers/ledgerController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(companyMiddleware);

router.post("/", createLedger);

router.get("/", getLedgers);

router.get("/:id", getLedgerById);

export default router;