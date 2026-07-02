import express from "express";

import {
  getDashboardSummary,
  getRecentSales,
  getRecentPurchases,
  getLowStockItems,
  getTopCustomers,
  getTopSuppliers,
  getMonthlySales,
  getMonthlyPurchases,
  getSalesPurchaseComparison,
} from "../controllers/dashboardController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import companyMiddleware from "../middleware/companyMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(companyMiddleware);

router.get("/", getDashboardSummary);

router.get("/recent-sales", getRecentSales);

router.get("/recent-purchases", getRecentPurchases);

router.get("/low-stock", getLowStockItems);
router.get("/top-customers", getTopCustomers);

router.get("/top-suppliers", getTopSuppliers);

router.get("/monthly-sales", getMonthlySales);

router.get("/monthly-purchases", getMonthlyPurchases);

router.get("/sales-vs-purchase", getSalesPurchaseComparison);

export default router;
