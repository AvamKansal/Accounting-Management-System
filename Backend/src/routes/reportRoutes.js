import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import companyMiddleware from "../middleware/companyMiddleware.js";

import {
  getTrialBalance,
  getLedgerReport,
  getProfitLoss,
  getBalanceSheet,
  getStockValuation,
} from "../controllers/reportController.js";

const router = express.Router();

router.get(
  "/trial-balance",
  authMiddleware,
  companyMiddleware,
  getTrialBalance
);

router.get(
  "/ledger/:ledgerId",
  authMiddleware,
  companyMiddleware,
  getLedgerReport
);

router.get(
  "/profit-loss",
  authMiddleware,
  companyMiddleware,
  getProfitLoss
);

router.get(
  "/balance-sheet",
  authMiddleware,
  companyMiddleware,
  getBalanceSheet
);

router.get(
  "/stock-valuation",
  authMiddleware,
  companyMiddleware,
  getStockValuation
);

export default router;